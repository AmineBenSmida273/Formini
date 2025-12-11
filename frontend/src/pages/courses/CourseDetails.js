import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/api';

export default function CourseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourseDetails();
    }, [id]);

    const fetchCourseDetails = async () => {
        try {
            setLoading(true);
            const response = await courseService.getCourse(id);
            setCourse(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erreur:', error);
            setLoading(false);
        }
    };

    const handleEnroll = () => {
        alert('Inscription à implémenter prochainement');
    };

    if (loading) return <div style={styles.center}>Chargement...</div>;
    if (!course) return <div style={styles.center}>Cours non trouvé</div>;

    return (
        <div style={styles.container}>
            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <button onClick={() => navigate('/courses')} style={styles.backBtn}>← Retour au catalogue</button>
                    <h1 style={styles.title}>{course.titre}</h1>
                    <p style={styles.desc}>{course.description}</p>
                    <div style={styles.meta}>
                        <span>⏱️ {course.duree} heures</span>
                        <span>🎓 {course.niveau}</span>
                        <span>⭐ 4.8/5 (24 avis)</span>
                    </div>
                    <button onClick={handleEnroll} style={styles.enrollBtn}>
                        S'inscrire ({course.prix === 0 ? 'Gratuit' : `${course.prix} €`})
                    </button>
                </div>
            </div>

            <div style={styles.content}>
                <div style={styles.section}>
                    <h2>Ce que vous apprendrez</h2>
                    <ul style={styles.list}>
                        {course.objectifs && course.objectifs.map((obj, i) => (
                            <li key={i}>{obj}</li>
                        ))}
                    </ul>
                </div>

                <div style={styles.section}>
                    <h2>Programme</h2>
                    <div style={styles.lessons}>
                        {course.lessons && course.lessons.length > 0 ? (
                            course.lessons.map((lesson, idx) => (
                                <div key={lesson._id} style={styles.lessonRow}>
                                    <span style={styles.lessonIndex}>{idx + 1}</span>
                                    <div style={styles.lessonInfo}>
                                        <h4>{lesson.titre}</h4>
                                        <span>{lesson.dureeMinutes} min</span>
                                    </div>
                                    <span style={styles.lock}>🔒</span>
                                </div>
                            ))
                        ) : (
                            <p>Le contenu sera bientôt disponible.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'white',
    },
    center: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '20px',
    },
    hero: {
        background: '#1f2937',
        color: 'white',
        padding: '60px 20px',
    },
    heroContent: {
        maxWidth: '1000px',
        margin: '0 auto',
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: '#9ca3af',
        cursor: 'pointer',
        marginBottom: '20px',
        fontSize: '14px',
    },
    title: {
        fontSize: '36px',
        marginBottom: '20px',
    },
    desc: {
        fontSize: '18px',
        color: '#d1d5db',
        lineHeight: '1.6',
        marginBottom: '30px',
        maxWidth: '800px',
    },
    meta: {
        display: 'flex',
        gap: '30px',
        marginBottom: '40px',
        color: '#e5e7eb',
    },
    enrollBtn: {
        padding: '15px 30px',
        background: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background 0.3s',
    },
    content: {
        maxWidth: '1000px',
        margin: '40px auto',
        padding: '0 20px',
        display: 'grid',
        gap: '40px',
    },
    section: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '30px',
    },
    list: {
        paddingLeft: '20px',
        lineHeight: '1.8',
    },
    lessons: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    lessonRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px',
        background: '#f9fafb',
        borderRadius: '8px',
        gap: '20px',
    },
    lessonIndex: {
        fontWeight: 'bold',
        color: '#9ca3af',
    },
    lessonInfo: {
        flex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lock: {
        fontSize: '20px',
    }
};
