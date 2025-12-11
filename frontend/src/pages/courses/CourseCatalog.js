import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/api';

export default function CourseCatalog() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        level: ''
    });

    useEffect(() => {
        fetchCourses();
    }, [filters]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            // Construct query string
            let query = `?search=${filters.search}`;
            if (filters.category) query += `&categorie=${filters.category}`;
            if (filters.level) query += `&niveau=${filters.level}`;

            // Note: courseService.getAllCourses currently doesn't accept args in api.js
            // We might need to update api.js to accept params, or just append query manually if api.js allows
            // Let's assume we update api.js or use direct axios if needed, but for now let's try passing the query string logic inside getAllCourses if possible, 
            // OR update api.js to `getAllCourses: (params) => api.get('/courses', { params })`

            // Since existing api.js is `getAllCourses: () => api.get('/courses')`, we need to update it first or just fetch all and filter client side.
            // Better to update api.js. I'll do that in a parallel step.
            const response = await courseService.getAllCourses(filters);
            setCourses(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erreur chargement cours:', error);
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <h1 style={styles.title}>📚 Catalogue des Cours</h1>
                    <button style={styles.dashBtn} onClick={() => navigate('/dashboard/student')}>
                        Mon Dashboard
                    </button>
                </div>
            </header>

            <div style={styles.content}>
                {/* Filters */}
                <div style={styles.filters}>
                    <input
                        type="text"
                        placeholder="Rechercher un cours..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        style={styles.searchInput}
                    />
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        style={styles.select}
                    >
                        <option value="">Toutes les catégories</option>
                        <option value="Développement Web">Développement Web</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                        <option value="Marketing">Marketing</option>
                    </select>
                    <select
                        value={filters.level}
                        onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                        style={styles.select}
                    >
                        <option value="">Tous les niveaux</option>
                        <option value="débutant">Débutant</option>
                        <option value="intermédiaire">Intermédiaire</option>
                        <option value="avancé">Avancé</option>
                    </select>
                </div>

                {/* Grid */}
                {loading ? (
                    <div style={styles.loading}>Chargement...</div>
                ) : courses.length > 0 ? (
                    <div style={styles.grid}>
                        {courses.map(course => (
                            <div key={course._id} style={styles.card}>
                                <div style={styles.cardParams}>
                                    <span style={styles.badge}>{course.categorie}</span>
                                    <span style={{ ...styles.badge, background: '#e5e7eb', color: '#374151' }}>
                                        {course.niveau}
                                    </span>
                                </div>
                                <h3 style={styles.cardTitle}>{course.titre}</h3>
                                <p style={styles.cardDesc}>{course.description.substring(0, 100)}...</p>
                                <div style={styles.cardFooter}>
                                    <span style={styles.price}>{course.prix === 0 ? 'Gratuit' : `${course.prix} €`}</span>
                                    <button
                                        style={styles.detailsBtn}
                                        onClick={() => navigate(`/courses/${course._id}`)}
                                    >
                                        Voir Détails
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={styles.empty}>Aucun cours trouvé.</div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: '#f3f4f6',
    },
    header: {
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px 0',
    },
    headerContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        fontSize: '24px',
        color: '#111827',
    },
    dashBtn: {
        padding: '10px 20px',
        background: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    content: {
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 20px',
    },
    filters: {
        display: 'flex',
        gap: '20px',
        marginBottom: '30px',
        flexWrap: 'wrap',
    },
    searchInput: {
        flex: 1,
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '16px',
    },
    select: {
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        background: 'white',
        fontSize: '16px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '30px',
    },
    card: {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
    },
    cardParams: {
        marginBottom: '10px',
        display: 'flex',
        gap: '10px',
    },
    badge: {
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '4px',
        background: '#eeHO4',
        color: '#4f46e5',
        background: '#e0e7ff',
        fontWeight: '600',
    },
    cardTitle: {
        margin: '0 0 10px 0',
        fontSize: '18px',
        color: '#1f2937',
    },
    cardDesc: {
        color: '#6b7280',
        fontSize: '14px',
        flex: 1,
        marginBottom: '20px',
    },
    cardFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '15px',
        borderTop: '1px solid #e5e7eb',
    },
    price: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#1f2937',
    },
    detailsBtn: {
        padding: '8px 16px',
        background: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
    },
    loading: {
        textAlign: 'center',
        fontSize: '18px',
        color: '#6b7280',
        marginTop: '40px',
    },
    empty: {
        textAlign: 'center',
        fontSize: '18px',
        color: '#6b7280',
        marginTop: '40px',
    }
};
