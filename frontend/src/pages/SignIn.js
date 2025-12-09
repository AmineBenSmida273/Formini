import React, { useEffect, useState } from "react";
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
  const [fbLoading, setFbLoading] = useState(false);

  useEffect(() => {
    // Charger le SDK Facebook si absent
    if (window.FB) return;
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/fr_FR/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.FB.init({
        appId: process.env.REACT_APP_FACEBOOK_APP_ID || "YOUR_FB_APP_ID",
        cookie: true,
        xfbml: true,
        version: "v19.0",
      });
    };
    document.body.appendChild(script);
  }, []);

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
      const email = formData.email.toLowerCase().trim();
      const isAdminEmail = email === 'admin@formini.com';

      // Si c'est l'admin, connexion directe sans MFA
      if (isAdminEmail) {
        const response = await authService.login({
          email: formData.email,
          mdp: formData.mdp,
        });

        const { token, user } = response.data;
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.removeItem('pendingVerificationEmail');
          
          // Rediriger vers le dashboard
          navigate('/dashboard');
        } else {
          alert("❌ Erreur : Réponse inattendue du serveur");
        }
      } else {
        // Pour les autres utilisateurs, utiliser MFA
        await authService.loginWithMFA({
          email: formData.email,
          mdp: formData.mdp,
        });
        localStorage.setItem('pendingVerificationEmail', formData.email);
        navigate('/verify-mfa', { state: { email: formData.email, flow: 'login' } });
        alert("✅ Code MFA envoyé. Vérifiez votre email.");
      }
      
    } catch (err) {
      alert("❌ Erreur : " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      alert("Facebook SDK non chargé");
      return;
    }
    setFbLoading(true);
    window.FB.login(
      async (response) => {
        try {
          if (response.status !== "connected") {
            setFbLoading(false);
            return;
          }
          const accessToken = response.authResponse.accessToken;
          const res = await authService.facebookLogin(accessToken);
          const { token, user } = res.data;
          if (token && user) {
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            navigate("/dashboard");
          } else {
            alert("❌ Réponse inattendue du serveur Facebook");
          }
        } catch (err) {
          alert("❌ Erreur Facebook : " + (err.response?.data?.message || err.message));
        } finally {
          setFbLoading(false);
        }
      },
      { scope: "email" }
    );
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
                onClick={handleFacebookLogin}
                disabled={fbLoading}
              >
                <span style={styles.socialIcon}>🔵</span>
                {fbLoading ? "Connexion..." : "Facebook"}
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
    background: "linear-gradient(135deg, #ffdab2ff, #fb923c)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  },

  card: {
    width: "80%",
    height: "95%",
    maxWidth: "1200px",
    background: "#fff",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)",
    display: "flex",
    overflow: "hidden",
    border: "1px solid rgba(249, 115, 22, 0.1)",
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
    background: "linear-gradient(135deg, #f97316, #fb923c)",
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
    color: "#1f2937",
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
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1.5px solid #e5e7eb",
    padding: "14px 16px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
    color: "#f97316",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },

  button: {
    marginTop: "10px",
    background: "#f97316",
    padding: "16px 24px",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(249, 115, 22, 0.25)",
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
    padding: "14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "12px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontSize: "14px",
    fontWeight: "500",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },

  socialIcon: {
    fontSize: "16px",
  },

  link: {
    color: "#f97316",
    textDecoration: "none",
  },

  link2: {
    color: "#f97316",
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
    border-color: #f97316;
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.08);
    background: #ffffff;
  }

  .input-group:focus-within {
    border-color: #f97316;
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
    background: #ffffff;
  }

  button:hover:not(:disabled) {
    background: #ea580c;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
  }

  .social-button:hover {
    border-color: #f97316;
    background: #fef3f2;
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.15);
    transform: translateY(-1px);
  }

  a:hover {
    text-decoration: underline;
    color: #ea580c;
  }
`;
document.head.appendChild(styleElement);