import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../component/common/Header.jsx'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import './ConsultationRequest.scss'

const FLOOR_PLAN_BUCKET = 'consultation-floor-plans'
const POSTCODE_SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
const MAX_FILE_SIZE = 10 * 1024 * 1024
const consultationTypes = ['아파트', '주택', '빌라/오피스텔', '상업공간', '부분공사', '기타']
const budgetOptions = [
  '3천만원 미만',
  '3천만원 이상 ~ 5천만원 미만',
  '5천만원 이상 ~ 1억원 미만',
  '1억원 이상 ~ 2억원 미만',
  '2억원 이상',
  '상담 후 결정',
]
const referralSources = ['검색', 'SNS', '지인 소개', '기존 고객', '기타']
let postcodeScriptPromise

const loadPostcodeScript = () => {
  if (window.daum?.Postcode) return Promise.resolve()
  if (postcodeScriptPromise) return postcodeScriptPromise

  postcodeScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = POSTCODE_SCRIPT_URL
    script.async = true
    script.onload = () => {
      if (window.daum?.Postcode) {
        resolve()
      } else {
        postcodeScriptPromise = null
        reject(new Error('주소 검색 서비스를 불러오지 못했습니다.'))
      }
    }
    script.onerror = () => {
      postcodeScriptPromise = null
      reject(new Error('주소 검색 서비스를 불러오지 못했습니다.'))
    }
    document.head.appendChild(script)
  })

  return postcodeScriptPromise
}

const ConsultationRequest = ({ isLoggedIn, onToggleLogin }) => {
  const [roadAddress, setRoadAddress] = useState('')
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false)
  const [addressSearchError, setAddressSearchError] = useState('')
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)
  const postcodeContainerRef = useRef(null)
  const detailAddressRef = useRef(null)

  useEffect(() => {
    if (!isAddressSearchOpen) return undefined
    let isMounted = true

    loadPostcodeScript()
      .then(() => {
        if (!isMounted || !postcodeContainerRef.current) return
        new window.daum.Postcode({
          oncomplete: (data) => {
            setRoadAddress(data.roadAddress || data.address)
            setIsAddressSearchOpen(false)
            detailAddressRef.current?.focus()
          },
        }).embed(postcodeContainerRef.current)
      })
      .catch((error) => {
        console.error('주소 검색 서비스를 불러오지 못했습니다.', error)
        if (isMounted) setAddressSearchError('주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      })

    return () => {
      isMounted = false
    }
  }, [isAddressSearchOpen])

  const handleFilesChange = (event) => {
    const nextFiles = Array.from(event.target.files ?? [])
    if (nextFiles.length > 2) {
      setNotice({ type: 'error', text: '평면도는 최대 2개까지 첨부할 수 있습니다.' })
      event.target.value = ''
      setFiles([])
      return
    }

    const invalidFile = nextFiles.find((file) => (
      !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)
      || file.size > MAX_FILE_SIZE
    ))
    if (invalidFile) {
      setNotice({ type: 'error', text: '평면도는 PDF, JPG, PNG 파일만 가능하며 파일당 10MB 이하여야 합니다.' })
      event.target.value = ''
      setFiles([])
      return
    }

    setNotice(null)
    setFiles(nextFiles)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setNotice(null)

    if (!isSupabaseConfigured) {
      setNotice({ type: 'error', text: '상담 접수 서버 설정이 필요합니다. 관리자에게 문의해 주세요.' })
      return
    }
    if (!window.crypto?.randomUUID) {
      setNotice({ type: 'error', text: '안전한 상담 접수 기능을 사용할 수 없는 브라우저입니다. 최신 브라우저를 이용해 주세요.' })
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const requestId = window.crypto.randomUUID()
    const uploadedPaths = []
    setIsSubmitting(true)

    try {
      for (const [index, file] of files.entries()) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'file'
        const path = `${requestId}/${index + 1}-${window.crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from(FLOOR_PLAN_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false })
        if (uploadError) throw uploadError
        uploadedPaths.push(path)
      }

      const { error } = await supabase.from('consultation_requests').insert({
        id: requestId,
        name: formData.get('name').trim(),
        phone: formData.get('phone').trim(),
        email: formData.get('email').trim(),
        site_address: roadAddress.trim(),
        site_detail_address: formData.get('site_detail_address').trim(),
        consultation_type: formData.get('consultation_type'),
        floor_plan_paths: uploadedPaths,
        portfolio_style: formData.get('portfolio_style').trim(),
        story: formData.get('story').trim(),
        area: Number(formData.get('area')),
        expected_budget: formData.get('expected_budget'),
        desired_start_date: formData.get('desired_start_date'),
        move_in_date: formData.get('move_in_date'),
        referral_source: formData.get('referral_source'),
        customer_request: formData.get('customer_request').trim() || null,
        privacy_agreed: formData.get('privacy_agreed') === 'on',
      })
      if (error) throw error

      form.reset()
      setFiles([])
      setRoadAddress('')
      setNotice({ type: 'success', text: '상담 신청이 접수되었습니다. 확인 후 입력하신 연락처로 안내드리겠습니다.' })
    } catch (error) {
      console.error('상담 신청을 접수하지 못했습니다.', error)
      const errorCode = error?.code ?? ''
      const errorMessage = error?.message ?? ''
      const isSchemaError = ['PGRST204', 'PGRST205', '42703', '42P01'].includes(errorCode)
        || /column .* does not exist|could not find the .* column|relation .* does not exist/i.test(errorMessage)
      const isPermissionError = errorCode === '42501'
        || /row-level security|permission denied/i.test(errorMessage)

      setNotice({
        type: 'error',
        text: isSchemaError
          ? '상담 신청 데이터베이스가 최신 입력 항목으로 업데이트되지 않았습니다. 관리자에게 Supabase에서 20261013000000_consultation_requests.sql과 20261013010000_consultation_form_fields.sql을 순서대로 적용해 달라고 요청해 주세요.'
          : isPermissionError
            ? files.length > 0 && uploadedPaths.length < files.length
              ? '평면도 업로드 권한이 설정되지 않았습니다. 관리자에게 상담 신청 마이그레이션과 Storage 업로드 정책을 확인해 달라고 요청해 주세요.'
              : '상담 접수 권한이 설정되지 않았습니다. 관리자에게 Supabase 상담 신청 마이그레이션과 RLS 정책을 확인해 달라고 요청해 주세요.'
            : /failed to fetch|networkerror|load failed/i.test(errorMessage)
              ? '상담 접수 서버에 연결할 수 없습니다. 인터넷 연결과 Supabase 설정을 확인한 뒤 다시 시도해 주세요.'
              : errorCode === '23514' || errorCode === '23502'
                ? '입력 내용이 접수 기준과 일치하지 않습니다. 날짜, 면적, 연락처와 필수 항목을 확인해 주세요.'
                : '상담 신청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header isLoggedIn={isLoggedIn} onToggleLogin={onToggleLogin} />
      <main className='consultation-page'>
        <header className='consultation-page__heading'>
          <p>SAEROM INTERIOR · CONSULTATION</p>
          <h1>상담 신청</h1>
          <span>공간에 대한 이야기를 들려주시면 새롬 인테리어가 함께 고민하겠습니다.</span>
        </header>

        <form className='consultation-form' onSubmit={handleSubmit}>
          <section className='consultation-form__section'>
            <h2>신청자 정보</h2>
            <div className='consultation-form__grid'>
              <label>
                성함 <em>필수</em>
                <input name='name' autoComplete='name' maxLength={100} required />
              </label>
              <label>
                연락처 <em>필수</em>
                <input name='phone' type='tel' autoComplete='tel' maxLength={30} placeholder='010-0000-0000' required />
              </label>
              <label>
                이메일 <em>필수</em>
                <input name='email' type='email' autoComplete='email' maxLength={254} required />
              </label>
              <div className='consultation-form__address consultation-form__wide'>
                <label htmlFor='site-road-address'>도로명 주소 <em>필수</em></label>
                <div className='consultation-form__address-row'>
                  <input
                    id='site-road-address'
                    name='site_address'
                    value={roadAddress}
                    autoComplete='street-address'
                    placeholder='주소 검색으로 도로명 주소를 입력해 주세요'
                    readOnly
                    required
                  />
                  <button
                    type='button'
                    onClick={() => {
                      setAddressSearchError('')
                      setIsAddressSearchOpen(true)
                    }}
                  >
                    주소 검색
                  </button>
                </div>
                <label htmlFor='site-detail-address'>상세 주소 <em>필수</em></label>
                <input
                  id='site-detail-address'
                  ref={detailAddressRef}
                  name='site_detail_address'
                  autoComplete='address-line2'
                  maxLength={300}
                  placeholder='동, 호수 등 상세 주소를 입력해 주세요'
                />
              </div>
            </div>
          </section>

          <section className='consultation-form__section'>
            <h2>공사 정보</h2>
            <div className='consultation-form__grid'>
              <label>
                상담 유형 <em>필수</em>
                <select name='consultation_type' defaultValue='' required>
                  <option value='' disabled>상담 유형을 선택해 주세요</option>
                  {consultationTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <fieldset className='consultation-form__wide'>
                <legend>평면도 첨부 <span>(선택)</span></legend>
                <p className='consultation-form__hint'>평면도를 주시면 보다 정확한 상담을 받으실 수 있습니다.</p>
                <input
                  name='floor_plans'
                  type='file'
                  accept='.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
                  multiple
                  onChange={handleFilesChange}
                  disabled={isSubmitting}
                />
                {files.length > 0 && <small>{files.map((file) => file.name).join(', ')}</small>}
                <small>PDF, JPG, PNG · 파일당 최대 10MB · 최대 2개</small>
              </fieldset>
              <label className='consultation-form__wide'>
                포트폴리오 스타일 <em>필수</em>
                <input
                  name='portfolio_style'
                  maxLength={500}
                  placeholder='원하시는 스타일을 자유롭게 입력해 주세요'
                  required
                />
              </label>
              <label className='consultation-form__wide'>
                새로운 Story · 인테리어 공사를 생각하게 된 이유 <em>필수</em>
                <textarea name='story' rows='4' maxLength={5000} required />
              </label>
              <label>
                인테리어 면적 (㎡) <em>필수</em>
                <input name='area' type='number' min='1' max='100000' step='0.1' required />
              </label>
              <label>
                기대 예산 <em>필수</em>
                <select name='expected_budget' defaultValue='' required>
                  <option value='' disabled>예산을 선택해 주세요</option>
                  {budgetOptions.map((budget) => <option key={budget}>{budget}</option>)}
                </select>
              </label>
              <label>
                공사 시작 희망일 <em>필수</em>
                <input name='desired_start_date' type='date' required />
              </label>
              <label>
                입주 예정일 <em>필수</em>
                <input name='move_in_date' type='date' required />
              </label>
              <label>
                유입 경로 <em>필수</em>
                <select name='referral_source' defaultValue='' required>
                  <option value='' disabled>새롬 인테리어를 알게 된 경로</option>
                  {referralSources.map((source) => <option key={source}>{source}</option>)}
                </select>
              </label>
              <label className='consultation-form__wide'>
                고객의 소리 · 요청사항 <span>(선택)</span>
                <textarea name='customer_request' rows='4' maxLength={5000} />
              </label>
            </div>
          </section>

          <section className='consultation-form__privacy'>
            <h2>개인정보 수집 및 이용 동의</h2>
            <p>상담 접수 및 안내를 위해 성함, 연락처, 이메일, 현장 위치 등 신청서에 작성한 정보를 수집·이용합니다. 개인정보는 상담 목적으로 이용하고, 관련 법령에 따른 보관 기간이 있는 경우 해당 기간 보관 후 파기합니다. 상담 신청 정보는 관리자 계정만 확인할 수 있습니다.</p>
            <label>
              <input type='checkbox' name='privacy_agreed' required />
              개인정보 수집 및 이용에 동의합니다. <em>필수</em>
            </label>
          </section>

          {notice && (
            <p className={`consultation-form__notice consultation-form__notice--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
              {notice.text}
            </p>
          )}
          <div className='consultation-form__actions'>
            <Link to='/'>취소</Link>
            <button type='submit' disabled={isSubmitting}>
              {isSubmitting ? '접수 중...' : '상담 신청하기'}
            </button>
          </div>
        </form>
        {isAddressSearchOpen && (
          <div className='consultation-address-modal' role='dialog' aria-modal='true' aria-labelledby='address-search-title'>
            <section className='consultation-address-modal__content'>
              <header>
                <h2 id='address-search-title'>도로명 주소 검색</h2>
                <button type='button' onClick={() => setIsAddressSearchOpen(false)}>닫기</button>
              </header>
              {addressSearchError
                ? <p className='consultation-address-modal__error' role='alert'>{addressSearchError}</p>
                : <div className='consultation-address-modal__embed' ref={postcodeContainerRef} />}
            </section>
          </div>
        )}
      </main>
    </>
  )
}

export default ConsultationRequest
