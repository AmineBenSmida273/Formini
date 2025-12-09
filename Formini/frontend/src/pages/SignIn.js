import React, { useState } from "react";
import { authService } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import signinImage from "../assets/images/SignIn.png";

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    mdp: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.loginWithMFA({
        email: formData.email,
        mdp: formData.mdp,
      });
      localStorage.setItem('pendingVerificationEmail', formData.email);
      navigate('/verify-mfa', { state: { email: formData.email, flow: 'login' } });
      alert("✅ Code MFA envoyé. Vérifiez votre email.");
      
    } catch (err) {
      alert("❌ Erreur : " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ---- LEFT FORM ---- */}
        <div style={styles.left}>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Continue your learning journey 🚀</p>

          <form onSubmit={handleSubmit} style={styles.form}>

            {/* EMAIL */}
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* PASSWORD */}
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type="password"
                placeholder="Password"
                name="mdp"
                value={formData.mdp}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* REMEMBER ME & FORGOT PASSWORD */}
            <div style={styles.optionsRow}>
              <div style={styles.rememberMe}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span style={{ marginLeft: 8, fontSize: "14px" }}>
                  Remember me
                </span>
              </div>
              
              <a href="/forgot-password" style={styles.forgotLink}>
                Forgot password?
              </a>
            </div>

            <button 
              style={{
                ...styles.button,
                ...(loading && styles.buttonLoading)
              }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* SOCIAL LOGIN */}
          <div style={styles.socialSection}>
            <div style={styles.divider}>
              <span style={styles.dividerText}>Or continue with</span>
            </div>
            
            <div style={styles.socialButtons}>
              <button 
                style={styles.socialButton}
                onClick={() => alert("Facebook login - À implémenter")}
              >
                <span style={styles.socialIcon}>🔵</span>
                Facebook
              </button>
              <button 
                style={styles.socialButton}
                onClick={() => {
                  window.location.href = "http://localhost:5000/api/auth/google";
                }}
              >
                <span style={styles.socialIcon}>🔴</span>
                Google
              </button>
            </div>
          </div>

          <p style={styles.footer}>
            Don't have an account ?{" "}
            <Link to="/register" style={styles.link2}>
                Sign up
            </Link>
          </p>
        </div>

        {/* ---- RIGHT IMAGE ---- */}
        <div style={styles.right}>
          <img src={signinImage} alt="signin" style={styles.image} />
        </div>

      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */
const styles = {
  page: {
    width: "100%",
    height: "100vh",
    background: "linear-gradient(120deg, #ef7212bb, #ffffffff, #ef7212bb)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Inter, Arial",
  },

  card: {
    width: "80%",
    height: "95%",
    maxWidth: "1200px",
    background: "#fff",
    borderRadius: "25px",
    boxShadow: "20px 20px 20px 20px rgba(0,0,0,0.1)",
    display: "flex",
    overflow: "hidden",
  },

  left: {
    width: "45%",
    padding: "50px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  right: {
    width: "55%",
    background: "#e6e6e6ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "90%",
  },

  title: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#2b2d42",
  },

  subtitle: {
    marginTop: "5px",
    fontSize: "15px",
    color: "#6b7280",
    marginBottom: "30px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  inputGroup: {
    background: "#f8f9fc",
    borderRadius: "10px",
    border: "1px solid #dfe3f0",
    padding: "12px",
    transition: "all 0.3s ease",
  },

  input: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
  },

  optionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
  },

  rememberMe: {
    display: "flex",
    alignItems: "center",
  },

  forgotLink: {
    color: "#4f46e5",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },

  button: {
    marginTop: "10px",
    background: "#4f46e5",
    padding: "14px",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
  },

  buttonLoading: {
    opacity: "0.7",
    cursor: "not-allowed",
  },

  socialSection: {
    marginTop: "30px",
  },

  divider: {
    position: "relative",
    textAlign: "center",
    margin: "20px 0",
  },

  dividerText: {
    background: "#fff",
    padding: "0 15px",
    color: "#6b7280",
    fontSize: "14px",
  },

  socialButtons: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
  },

  socialButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    border: "1px solid #dfe3f0",
    borderRadius: "10px",
    background: "white",
    cursor: "pointer",
    transition: "0.3s",
    fontSize: "14px",
    fontWeight: "500",
  },

  socialIcon: {
    fontSize: "16px",
  },

  link: {
    color: "#4f46e5",
    textDecoration: "none",
  },

  link2: {
    color: "#6d28d9",
    fontWeight: "bold",
    textDecoration: "none",
  },

  footer: {
    marginTop: "20px",
    fontSize: "14px",
    textAlign: "center",
  },
};

// Effets hover
const styleElement = document.createElement('style');
styleElement.textContent = `
  .input-group:hover {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  button:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
  }

  .social-button:hover {
    border-color: #4f46e5;
    background: #f8f9fc;
  }

  a:hover {
    text-decoration: underline;
  }
`;
document.head.appendChild(styleElement);