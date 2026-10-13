import React from 'react'
import Header from '../component/common/Header'
import Main from '../component/common/Main'
import Footer from '../component/common/Footer'
export const Layout = ({ isLoggedIn, onToggleLogin }) => {
  return (
    <div>
        <Header isLoggedIn={isLoggedIn} onToggleLogin={onToggleLogin} />
        <Main />
        <Footer/>
    </div>
  )
}
