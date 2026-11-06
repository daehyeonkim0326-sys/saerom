import Header from '../component/common/Header'
import Main from '../component/common/Main'
export const Layout = ({ isLoggedIn, onToggleLogin }) => {
  return (
    <div>
        <Header isLoggedIn={isLoggedIn} onToggleLogin={onToggleLogin} />
        <Main />
    </div>
  )
}
