import { useState, useEffect } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection, onSnapshot, query, where, doc, setDoc, getDoc, getDocs, updateDoc, arrayUnion
} from "firebase/firestore";

export default function SwipePage({ club }) {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiping, setSwiping] = useState(null); // "left" | "right"
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState(new Set());

  useEffect(() => {
    if (!club) return;
    setLoading(true);

    // Get all books added by club members
    const q = query(collection(db, "books"), where("addedBy", "in", club.memberIds));
    const unsub = onSnapshot(q, async snap => {
      const allBooks = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Get user's votes for this club
      const votesSnap = await getDocs(
        query(collection(db, "votes"), where("clubId", "==", club.id), where("userId", "==", user.uid))
      );
      const voted = new Set(votesSnap.docs.map(d => d.data().bookId));
      setVotedIds(voted);

      const pending = allBooks.filter(b => !voted.has(b.id));
      setBooks(pending);
      setCurrentIndex(0);
      setLoading(false);
    });
    return unsub;
  }, [club?.id]);

  async function handleVote(liked) {
    const book = books[currentIndex];
    if (!book) return;

    setSwiping(liked ? "right" : "left");

    setTimeout(async () => {
      // Save vote
      await setDoc(doc(db, "votes", `${club.id}_${user.uid}_${book.id}`), {
        clubId: club.id,
        userId: user.uid,
        bookId: book.id,
        liked,
        createdAt: new Date()
      });

      // Check for match
      if (liked) {
        await checkMatch(book);
      }

      setCurrentIndex(prev => prev + 1);
      setSwiping(null);
    }, 350);
  }

  async function checkMatch(book) {
    // Get all votes for this book in this club
    const votesSnap = await getDocs(
      query(collection(db, "votes"), where("clubId", "==", club.id), where("bookId", "==", book.id), where("liked", "==", true))
    );
    const likedBy = votesSnap.docs.map(d => d.data().userId);
    likedBy.push(user.uid); // include current vote

    // Check if all members liked it
    const allLiked = club.memberIds.every(id => likedBy.includes(id));
    if (allLiked) {
      // Create match!
      await setDoc(doc(db, "matches", `${club.id}_${book.id}`), {
        clubId: club.id,
        clubName: club.name,
        bookId: book.id,
        book,
        matchedAt: new Date()
      });
    }
  }

  if (!club) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="emoji">👆</div>
          <h3>Primero seleccioná un club</h3>
          <p>Andá a la pestaña "Mis clubs" y hacé clic en uno para activarlo.</p>
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
          <div className={`swipe-card ${swiping === "left" ? "swiping-left" : swiping === "right" ? "swiping-right" : ""}`}>
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
