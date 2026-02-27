import { useState, useEffect } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, where
} from "firebase/firestore";

async function searchGoogleBooks(query) {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=12`
  );
  const data = await res.json();
  return (data.items || []).map(item => ({
    googleId: item.id,
    title: item.volumeInfo.title || "Sin título",
    author: (item.volumeInfo.authors || ["Autor desconocido"]).join(", "),
    description: item.volumeInfo.description || "Sin descripción disponible.",
    cover: item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") || null,
  }));
}

export default function MyBooksPage() {
  const { user } = useAuth();
  const [myBooks, setMyBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    const q = query(collection(db, "books"), where("addedBy", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      const books = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMyBooks(books);
      setAddedIds(new Set(books.map(b => b.googleId)));
    });
    return unsub;
  }, [user.uid]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchGoogleBooks(searchQuery);
    setSearchResults(results);
    setSearching(false);
  }

  async function handleAddBook(book) {
    if (addedIds.has(book.googleId)) return;
    await addDoc(collection(db, "books"), {
      ...book,
      addedBy: user.uid,
      addedByName: user.displayName,
      createdAt: new Date()
    });
    setSearchResults(prev =>
      prev.filter(b => b.googleId !== book.googleId)
    );
  }

  async function handleRemove(bookId) {
    await deleteDoc(doc(db, "books", bookId));
  }

  return (
    <div className="main-content">
      <div className="section-header">
        <div>
          <h2>Mis libros</h2>
          <p>Buscá y sumá libros que querés leer</p>
        </div>
      </div>

      <form className="search-box" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Buscá un libro por título o autor..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="btn-search" disabled={searching}>
          {searching ? "..." : "Buscá nena"}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(book => (
            <div key={book.googleId} className="search-result-item">
              {book.cover
                ? <img src={book.cover} alt={book.title} />
                : <div style={{ width: 50, height: 70, background: "#E8E2D9", borderRadius: 4, display:"flex", alignItems:"center", justifyContent:"center" }}>📖</div>
              }
              <div className="search-result-info">
                <h4>{book.title}</h4>
                <p>{book.author}</p>
                <small>{book.description}</small>
              </div>
              <button
                className="btn-add-book"
                onClick={() => handleAddBook(book)}
                disabled={addedIds.has(book.googleId)}
              >
                {addedIds.has(book.googleId) ? "✓ Agregado" : "+ Agregar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {myBooks.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">🦋</div>
          <h3>Todavía no agregaste libros, metelee</h3>
          <p>no sabia q emoji poner</p>
        </div>
      ) : (
        <div className="books-grid">
          {myBooks.map(book => (
            <div key={book.id} className="book-card">
              <button className="btn-remove" onClick={() => handleRemove(book.id)} title="Eliminar">✕</button>
              {book.cover
                ? <img src={book.cover} alt={book.title} className="book-cover" />
                : <div className="book-cover-placeholder">📖</div>
              }
              <div className="book-info">
                <h4>{book.title}</h4>
                <p>{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
