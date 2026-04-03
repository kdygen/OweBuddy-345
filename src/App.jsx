import { useState } from 'react'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

function App() {
    const [screen, setScreen] = useState('landing')
    const [userName, setUserName] = useState('Guest user')

    const openDashboard = (name) => {
        setUserName(name?.trim() || 'Guest user')
        setScreen('dashboard')
    }

    return (
        <>
            {screen === 'landing' && (
                <LandingPage onLogin={() => setScreen('login')} onSignup={() => setScreen('signup')} />
            )}

            {screen === 'login' && (
                <LoginPage
                    onBack={() => setScreen('landing')}
                    onLoginSuccess={openDashboard}
                    onOpenSignup={() => setScreen('signup')}
                />
            )}

            {screen === 'signup' && (
                <SignupPage
                    onBack={() => setScreen('landing')}
                    onOpenLogin={() => setScreen('login')}
                    onSignupSuccess={openDashboard}
                />
            )}

            {screen === 'dashboard' && (
                <DashboardPage onLogout={() => setScreen('landing')} userName={userName} />
            )}
        </>
    )
}

export default App