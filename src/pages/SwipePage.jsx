import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection, query, where, doc, setDoc, getDocs
} from "firebase/firestore";

export default function SwipePage({ club }) {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiping, setSwiping] = useState(null);
  const [loading, setLoading] = useState(true);
  // Cache all club votes in memory to avoid re-fetching
  const clubVotesRef = useRef({});

  useEffect(() => {
    if (!club) return;
    setLoading(true);

    async function loadAll() {
      // Fetch books and votes in parallel
      const [booksSnap, myVotesSnap, allVotesSnap] = await Promise.all([
        getDocs(query(collection(db, "books"), where("addedBy", "in", club.memberIds))),
        getDocs(query(collection(db, "votes"), where("clubId", "==", club.id), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "votes"), where("clubId", "==", club.id)))
      ]);

      const allBooks = booksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const myVotedIds = new Set(myVotesSnap.docs.map(d => d.data().bookId));

      // Build votes cache: { bookId: [userId, ...] }
      const votesCache = {};
      allVotesSnap.docs.forEach(d => {
        const { bookId, userId, liked } = d.data();
        if (liked) {
          if (!votesCache[bookId]) votesCache[bookId] = [];
          votesCache[bookId].push(userId);
        }
      });
      clubVotesRef.current = votesCache;

      const pending = allBooks.filter(b => !myVotedIds.has(b.id));
      setBooks(pending);
      setCurrentIndex(0);
      setLoading(false);
    }

    loadAll();
  }, [club?.id]);

  async function handleVote(liked) {
    const book = books[currentIndex];
    if (!book) return;

    // Animate immediately — no waiting
    setSwiping(liked ? "right" : "left");

    // Save vote in background (don't await before advancing)
    const votePromise = setDoc(doc(db, "votes", `${club.id}_${user.uid}_${book.id}`), {
      clubId: club.id,
      userId: user.uid,
      bookId: book.id,
      liked,
      createdAt: new Date()
    });

    // Advance card after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwiping(null);
    }, 300);

    // Check match in background using cache
    if (liked) {
      await votePromise;
      const likedBy = clubVotesRef.current[book.id] || [];
      const allLiked = club.memberIds.every(id => likedBy.includes(id) || id === user.uid);
      if (allLiked) {
        await setDoc(doc(db, "matches", `${club.id}_${book.id}`), {
          clubId: club.id,
          clubName: club.name,
          bookId: book.id,
          book,
          matchedAt: new Date()
        });
      }
      // Update local cache
      if (!clubVotesRef.current[book.id]) clubVotesRef.current[book.id] = [];
      clubVotesRef.current[book.id].push(user.uid);
    }
  }

  if (!club) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="emoji">✨</div>
          <h3>Primero seleccioná un club</h3>
          <p>Andá a la pestaña "clubsillos" y hacé clic en uno para activarlo.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="emoji">⏳</div>
          <h3>Cargando libros...</h3>
        </div>
      </div>
    );
  }

  const currentBook = books[currentIndex];
  const nextBook = books[currentIndex + 1];

  if (!currentBook) {
    return (
      <div className="main-content">
        <div className="all-swiped">
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎉</div>
          <h3>¡Ya votaste todos los libros!</h3>
          <p>Esperá a que tus amigas agreguen más libros o revisá los matches.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="section-header">
        <div>
          <h2>Swipear</h2>
          <p>Club: {club.name}</p>
        </div>
      </div>

      <div className="swipe-container">
        <p className="swipe-progress">{books.length - currentIndex} libro{books.length - currentIndex !== 1 ? "s" : ""} por votar</p>

        <div className="swipe-card-wrapper">
          {/* Next card rendered behind for instant feel */}
          {nextBook && (
            <div className="swipe-card" style={{ transform: "scale(0.96) translateY(8px)", zIndex: 0, opacity: 0.7 }}>
              {nextBook.cover
                ? <img src={nextBook.cover} alt={nextBook.title} />
                : <div className="swipe-card-placeholder">📖</div>
              }
              <div className="swipe-card-body">
                <h3>{nextBook.title}</h3>
                <p className="author">{nextBook.author}</p>
              </div>
            </div>
          )}

          {/* Current card */}
          <div
            className={`swipe-card ${swiping === "left" ? "swiping-left" : swiping === "right" ? "swiping-right" : ""}`}
            style={{ zIndex: 1 }}
          >
            {currentBook.cover
              ? <img src={currentBook.cover} alt={currentBook.title} />
              : <div className="swipe-card-placeholder">📖</div>
            }
            <div className="swipe-card-body">
              <h3>{currentBook.title}</h3>
              <p className="author">{currentBook.author}</p>
              <p>{currentBook.description}</p>
              <p className="swipe-added-by">Sugerido por {currentBook.addedByName}</p>
            </div>
          </div>
        </div>

        <div className="swipe-buttons">
          <button className="btn-swipe nope" onClick={() => handleVote(false)} title="No me interesa">✕</button>
          <button className="btn-swipe like" onClick={() => handleVote(true)} title="¡Lo quiero leer!">♥</button>
        </div>
      </div>
    </div>
  );
}
