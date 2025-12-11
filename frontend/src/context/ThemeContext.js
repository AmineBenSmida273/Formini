import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
    light: {
        name: 'light',
        colors: {
            background: '#f97316', // Solid Orange background as requested
            paper: '#ffffff',
            text: '#111827',
            textSecondary: '#4b5563',
            primary: '#f97316',
            border: '#e5e7eb',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            hover: '#fff7ed',
            shadow: 'rgba(0, 0, 0, 0.05)'
        }
    },
    dark: {
        name: 'dark',
        colors: {
            background: '#000000',
            paper: '#111827',
            text: '#ffffff', // Pure white text for high contrast on dark backgrounds
            textSecondary: '#9ca3af',
            primary: '#f97316',
            border: '#374151', // Slightly lighter border for visibility
            success: '#059669',
            warning: '#d97706',
            error: '#ef4444',
            hover: '#1f2937',
            shadow: 'rgba(0, 0, 0, 0.5)'
        }
    }
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });

    const [theme, setTheme] = useState(isDarkMode ? themes.dark : themes.light);

    useEffect(() => {
        setTheme(isDarkMode ? themes.dark : themes.light);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

        // Apply background color to body
        document.body.style.backgroundColor = isDarkMode ? themes.dark.colors.background : themes.light.colors.background;
        document.body.style.color = isDarkMode ? themes.dark.colors.text : themes.light.colors.text;
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme: theme.colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
