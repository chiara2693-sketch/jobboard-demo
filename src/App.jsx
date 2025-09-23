import { useState, useEffect } from "react";
import { MessageCircle, Phone } from "lucide-react";

const API_URL = "https://jobboard-demo.onrender.com";

// Utenti demo (login locale)
const demoUsers = [
  { role: "candidate", name: "Mario Rossi", email: "mario@example.com", password: "123456" },
  { role: "candidate", name: "Anna Bianchi", email: "anna@example.com", password: "123456" },
  { role: "company", name: "TechCorp", email: "hr@techcorp.com", password: "123456" },
  { role: "company", name: "DataWorks", email: "hr@dataworks.com", password: "123456" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [chatCandidate, setChatCandidate] = useState(null);
  const [messages, setMessages] = useState({});

  // 🔄 Carica le offerte dal backend e inserisce default se vuoto
  useEffect(() => {
    const fetchJobs = async () => {
      let res = await fetch(`${API_URL}/jobs`);
      let data = await res.json();

      // Se il DB è vuoto, inserisci offerte di default
      if (data.length === 0) {
        const defaultJobs = [
          { title: "Frontend Developer", company: "TechCorp", location: "Milano", contract: "Full-time" },
          { title: "Backend Engineer", company: "DataWorks", location: "Roma", contract: "Full-time" },
        ];
        for (let job of defaultJobs) {
          await fetch(`${API_URL}/jobs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(job),
          });
        }
        // Ricarica le offerte dopo averle inserite
        res = await fetch(`${API_URL}/jobs`);
        data = await res.json();
      }

      setJobs(data);
    };

    fetchJobs();
  }, []);

  // Login
  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const found = demoUsers.find((u) => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      setIsLogin(false);
    } else {
      alert("Email o password errati");
    }
  };

  // Candidatura
  const applyJob = async (jobId) => {
    await fetch(`${API_URL}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        candidateName: user.name,
        candidateEmail: user.email,
      }),
    });
    alert("✅ Candidatura inviata!");
  };

  // Carica candidature per un’offerta
  const loadApplications = async (jobId) => {
    const res = await fetch(`${API_URL}/applications/${jobId}`);
    return await res.json();
  };

  // Chat finta
  const sendMessage = (email, text) => {
    setMessages((prev) => ({
      ...prev,
      [email]: [...(prev[email] || []), { from: user.email, text }],
    }));
  };

  // Chiamata finta
  const startCall = (candidate) => {
    alert(`📞 Simulazione chiamata con ${candidate.candidateName || candidate.name}`);
  };

  // ------------------ UI ------------------

  if (!user) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Job Board Demo</h1>
        <form onSubmit={handleLogin}>
          <input type="email" name="email" placeholder="Email" required />
          <br />
          <input type="password" name="password" placeholder="Password" required />
          <br />
          <button type="submit">Login</button>
        </form>
        <p><b>Utenti demo:</b></p>
        <ul>
          {demoUsers.map((u) => (
            <li key={u.email}>
              {u.role} → {u.email} / {u.password}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Vista candidato
  if (user.role === "candidate") {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Benvenuto {user.name}</h2>
        <h3>Annunci disponibili</h3>
        {jobs.map((job) => (
          <div key={job.id} style={{ border: "1px solid #ccc", margin: "1rem", padding: "1rem" }}>
            <h4>{job.title}</h4>
            <p>{job.company} – {job.location} ({job.contract})</p>
            <button onClick={() => applyJob(job.id)}>Candidati</button>
          </div>
        ))}
      </div>
    );
  }

  // Vista azienda
  if (user.role === "company") {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Area Azienda – {user.name}</h2>
        <h3>Le tue offerte di lavoro</h3>
        {jobs
          .filter((job) => job.company === user.name)
          .map((job) => (
            <CompanyJob
              key={job.id}
              job={job}
              loadApplications={loadApplications}
              setChatCandidate={setChatCandidate}
              startCall={startCall}
              chatCandidate={chatCandidate}
              messages={messages}
              sendMessage={sendMessage}
              user={user}
            />
          ))}
      </div>
    );
  }
}

// ---------------- COMPONENTE Annuncio con candidature ----------------
function CompanyJob({ job, loadApplications, setChatCandidate, startCall, chatCandidate, messages, sendMessage, user }) {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      const data = await loadApplications(job.id);
      setApplications(data);
    };
    fetchApplications();
  }, [job.id, loadApplications]);

  return (
    <div style={{ border: "1px solid #ccc", margin: "1rem", padding: "1rem" }}>
      <h4>{job.title}</h4>
      <p>Candidati:</p>
      <ul>
        {applications.map((c) => (
          <li key={c.id}>
            {c.candidateName} ({c.candidateEmail}){" "}
            <MessageCircle
              style={{ cursor: "pointer", marginLeft: "10px" }}
              onClick={() => setChatCandidate({ ...c, jobId: job.id })}
            />
            <Phone
              style={{ cursor: "pointer", marginLeft: "10px" }}
              onClick={() => startCall({ ...c, jobId: job.id })}
            />
          </li>
        ))}
      </ul>

      {chatCandidate && chatCandidate.jobId === job.id && (
        <div style={{ border: "1px solid #444", padding: "1rem", marginTop: "1rem" }}>
          <h4>Chat con {chatCandidate.candidateName}</h4>
          <div style={{ minHeight: "100px", border: "1px solid #ccc", padding: "0.5rem" }}>
            {(messages[chatCandidate.candidateEmail] || []).map((m, i) => (
              <p key={i}><b>{m.from}:</b> {m.text}</p>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = e.target.msg.value;
              sendMessage(chatCandidate.candidateEmail, text);
              e.target.reset();
            }}
          >
            <input type="text" name="msg" placeholder="Scrivi un messaggio" required />
            <button type="submit">Invia</button>
          </form>
        </div>
      )}
    </div>
  );
}
