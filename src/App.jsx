import './App.scss'
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './component/common/Header.jsx'
import { Layout } from './layout/Layout.jsx'
import PostDetail from './pages/PostDetail.jsx'
import WritePost from './pages/WritePost.jsx'
import CategoryPosts from './pages/CategoryPosts.jsx'
import MyPage from './pages/MyPage.jsx'
import MyPosts from './pages/MyPosts.jsx'
import About from './pages/About.jsx'
import ConsultationRequest from './pages/ConsultationRequest.jsx'
import AdminConsultations from './pages/AdminConsultations.jsx'
import LoginModal from './component/common/LoginModal.jsx'
import { supabase } from './lib/supabase.js'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) return undefined

    let isMounted = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(Boolean(session))
      setIsAdmin(session?.user?.app_metadata?.role === 'admin')
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
        setIsLoginOpen(true)
      }
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return
      if (error) console.error('세션을 불러오지 못했습니다.', error)
      setIsLoggedIn(Boolean(data.session))
      setIsAdmin(data.session?.user?.app_metadata?.role === 'admin')
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleToggleLogin = async () => {
    if (isLoggedIn) {
      const { error } = await supabase.auth.signOut()
      if (error) console.error('로그아웃하지 못했습니다.', error)
      setIsAdmin(false)
      return
    }

    setIsLoginOpen(true)
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route
          path="/"
          element={<Layout isLoggedIn={isLoggedIn} onToggleLogin={handleToggleLogin} />}
        />
        <Route
          path="/post/:id"
          element={
            <>
              <Header isLoggedIn={isLoggedIn} onToggleLogin={handleToggleLogin} />
              <PostDetail isAdmin={isAdmin} />
            </>
          }
        />
        <Route
          path="/about"
          element={<About isLoggedIn={isLoggedIn} onToggleLogin={handleToggleLogin} />}
        />
        <Route
          path="/consultation"
          element={<ConsultationRequest isLoggedIn={isLoggedIn} onToggleLogin={handleToggleLogin} />}
        />
        <Route
          path="/category/상담"
          element={<ConsultationRequest isLoggedIn={isLoggedIn} onToggleLogin={handleToggleLogin} />}
        />
        <Route
          path="/write"
          element={
            <>
              <Header isLoggedIn={isLoggedIn} onToggleLogin={handleToggleLogin} />
              <WritePost isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
            </>
          }
        />
        <Route
          path="/edit/:postId"
          element={
            <>
              <Header isLoggedIn={isLoggedIn} onToggleLogin={handleToggleLogin} />
              <WritePost isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
            </>
          }
        />
        <Route
          path="/mypage"
          element={
            <>
              <Header isLoggedIn={isLoggedIn} onToggleLogin={handleToggleLogin} />
              <MyPage isLoggedIn={isLoggedIn} isAdmin={isAdmin} onToggleLogin={handleToggleLogin} />
            </>
          }
        />
        <Route
          path="/admin/consultations"
          element={
            <AdminConsultations
              isLoggedIn={isLoggedIn}
              isAdmin={isAdmin}
              onToggleLogin={handleToggleLogin}
            />
          }
        />
        <Route
          path="/my-posts"
          element={
            <>
              <Header isLoggedIn={isLoggedIn} onToggleLogin={handleToggleLogin} />
              <MyPosts isLoggedIn={isLoggedIn} />
            </>
          }
        />
        <Route
          path="/category/:category"
          element={
            <>
              <Header isLoggedIn={isLoggedIn} onToggleLogin={handleToggleLogin} />
              <CategoryPosts isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
            </>
          }
        />
      </Routes>
      {isLoginOpen && (
        <LoginModal
          isPasswordRecovery={isPasswordRecovery}
          onClose={() => {
            setIsLoginOpen(false)
            setIsPasswordRecovery(false)
          }}
          onAuthenticated={() => {
            setIsLoggedIn(true)
            setIsLoginOpen(false)
            setIsPasswordRecovery(false)
          }}
        />
      )}
    </BrowserRouter>
  )
}

export default App
