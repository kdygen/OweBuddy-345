import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import { auth } from './lib/firebase'

function App() {
    const [screen, setScreen] = useState('landing')
    const [userName, setUserName] = useState('Guest user')
    const [userId, setUserId] = useState('')
    const [authReady, setAuthReady] = useState(false)

    useEffect(() => {
        if (!auth) {
            setAuthReady(true)
            return undefined
        }

        return onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid)
                setUserName(user.displayName?.trim() || user.email?.trim() || 'Guest user')
                setScreen('dashboard')
            } else {
                setUserId('')
                setUserName('Guest user')
                setScreen('landing')
            }

            setAuthReady(true)
        })
    }, [])

    const openDashboard = (user) => {
        setUserId(user.uid)
        setUserName(user.displayName?.trim() || user.email?.trim() || 'Guest user')
        setScreen('dashboard')
    }

    const handleLogout = async () => {
        if (!auth) {
            setScreen('landing')
            return
        }

        await signOut(auth)
    }

    if (!authReady) {
        return null
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
                <DashboardPage onLogout={handleLogout} userId={userId} userName={userName} />
            )}
        </>
    )
}

export default App