import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../component/common/Header.jsx'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import './AdminConsultations.scss'

const FLOOR_PLAN_BUCKET = 'consultation-floor-plans'
const fields = [
  ['성함', 'name'],
  ['연락처', 'phone'],
  ['이메일', 'email'],
  ['도로명 주소', 'site_address'],
  ['상세 주소', 'site_detail_address'],
  ['상담 유형', 'consultation_type'],
  ['인테리어 면적', 'area', (value) => `${value}㎡`],
  ['기대 예산', 'expected_budget'],
  ['공사 시작 희망일', 'desired_start_date'],
  ['입주 예정일', 'move_in_date'],
  ['유입 경로', 'referral_source'],
  ['포트폴리오 스타일', 'portfolio_style'],
]

const AdminConsultations = ({ isLoggedIn, isAdmin, onToggleLogin }) => {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [fileLinks, setFileLinks] = useState({})

  useEffect(() => {
    let isMounted = true

    const loadRequests = async () => {
      if (!isLoggedIn || !isAdmin || !isSupabaseConfigured) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage('')
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('상담 신청 정보를 불러오지 못했습니다.', error)
        if (isMounted) {
          setErrorMessage('상담 신청 정보를 불러오지 못했습니다. Supabase 설정과 권한을 확인해 주세요.')
          setIsLoading(false)
        }
        return
      }

      const linkEntries = await Promise.all((data ?? []).flatMap((request) => (
        (request.floor_plan_paths ?? []).map(async (path) => {
          const { data: signedData, error: signedUrlError } = await supabase.storage
            .from(FLOOR_PLAN_BUCKET)
            .createSignedUrl(path, 60 * 60)
          if (signedUrlError) {
            console.error('평면도 링크를 만들지 못했습니다.', signedUrlError)
            return [path, null]
          }
          return [path, signedData.signedUrl]
        })
      )))

      if (isMounted) {
        setRequests(data ?? [])
        setFileLinks(Object.fromEntries(linkEntries))
        setIsLoading(false)
      }
    }

    loadRequests()
    return () => {
      isMounted = false
    }
  }, [isAdmin, isLoggedIn])

  return (
    <>
      <Header isLoggedIn={isLoggedIn} onToggleLogin={onToggleLogin} />
      <main className='admin-consultations'>
        {!isLoggedIn ? (
          <section className='admin-consultations__notice'>
            <h1>관리자 로그인이 필요합니다</h1>
            <p>상담 신청 정보는 관리자 계정으로만 확인할 수 있습니다.</p>
            <Link to='/'>홈으로</Link>
          </section>
        ) : !isAdmin ? (
          <section className='admin-consultations__notice'>
            <h1>접근 권한이 없습니다</h1>
            <p>상담 신청 정보는 관리자 계정으로만 확인할 수 있습니다.</p>
            <Link to='/mypage'>마이페이지</Link>
          </section>
        ) : (
          <>
            <header className='admin-consultations__heading'>
              <p>ADMIN · CONSULTATION</p>
              <h1>상담 신청 관리</h1>
              <span>접수된 상담 신청 {requests.length}건</span>
            </header>
            {isLoading ? (
              <p className='admin-consultations__empty' role='status'>상담 신청 정보를 불러오는 중입니다.</p>
            ) : errorMessage ? (
              <p className='admin-consultations__empty admin-consultations__empty--error' role='alert'>
                {errorMessage}
              </p>
            ) : requests.length === 0 ? (
              <p className='admin-consultations__empty'>접수된 상담 신청이 없습니다.</p>
            ) : (
              <div className='admin-consultations__list'>
                {requests.map((request) => (
                  <article className='admin-consultation' key={request.id}>
                    <header>
                      <div>
                        <p>{request.consultation_type} · {request.name}</p>
                        <time dateTime={request.created_at}>
                          {new Date(request.created_at).toLocaleString('ko-KR')}
                        </time>
                      </div>
                      <a href={`mailto:${request.email}`}>이메일 보내기</a>
                    </header>
                    <dl>
                      {fields.map(([label, key, format]) => (
                        <div key={key}>
                          <dt>{label}</dt>
                          <dd>{format ? format(request[key]) : request[key]}</dd>
                        </div>
                      ))}
                    </dl>
                    <section>
                      <h2>공사를 생각하게 된 이유</h2>
                      <p>{request.story}</p>
                    </section>
                    {request.customer_request && (
                      <section>
                        <h2>고객의 소리 · 요청사항</h2>
                        <p>{request.customer_request}</p>
                      </section>
                    )}
                    {request.floor_plan_paths?.length > 0 && (
                      <section>
                        <h2>평면도</h2>
                        <ul>
                          {request.floor_plan_paths.map((path) => (
                            <li key={path}>
                              {fileLinks[path]
                                ? <a href={fileLinks[path]} target='_blank' rel='noreferrer'>{path.split('/').pop()}</a>
                                : '첨부파일 링크를 만들 수 없습니다.'}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}

export default AdminConsultations
