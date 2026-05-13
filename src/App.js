import React, { useEffect, useState } from 'react';
import Provider from './context/';
import ThemeProvider from './features/ThemeProvider'
import Nav from './features/Nav';
import Main from './features/Main';
import Home from './features/Home';

const App = () => {
    const [view, setView] = useState(window.location.hash === '#editor' ? 'editor' : 'home');

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash === '#editor') {
                setView('editor');
            } else {
                setView('home');
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const isEditor = view === 'editor';

    return (<Provider>
        <ThemeProvider>
            {isEditor && <Nav />}
            {isEditor ? <Main /> : <Home />}
        </ThemeProvider>
    </Provider>);
};

export default App;
