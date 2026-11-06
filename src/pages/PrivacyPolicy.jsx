import Header from '../component/common/Header.jsx'
import './PrivacyPolicy.scss'

const supabaseRegion = import.meta.env.VITE_SUPABASE_REGION?.trim() || 'Northeast Asia (Seoul)'

const PrivacyPolicy = ({ isLoggedIn, onToggleLogin }) => (
  <>
    <Header isLoggedIn={isLoggedIn} onToggleLogin={onToggleLogin} />
    <main className='privacy-page'>
      <header className='privacy-page__heading'>
        <p>SAEROM INTERIOR</p>
        <h1>개인정보 처리방침</h1>
        <span>시행일: 2026년 10월 23일</span>
      </header>

      <article className='privacy-page__content'>
        <p>새롬 인테리어(대표 김명열, 이하 “운영자”)는 서비스 제공에 필요한 개인정보를 목적에 맞게 처리하고 보호합니다.</p>

        <section>
          <h2>1. 처리 목적과 항목</h2>
          <h3>회원 계정</h3>
          <p>회원 가입과 로그인을 위해 Google 또는 카카오 간편 로그인 과정에서 인증 제공자가 전달하는 계정 식별 정보와 프로필 정보를 처리합니다.</p>
          <h3>상담 신청</h3>
          <p>상담 접수와 상담 안내를 위해 성명, 연락처, 이메일, 도로명 주소, 상담 유형, 희망 스타일, 공사 사유, 면적, 예산, 희망 일정과 유입 경로를 처리합니다. 상세 주소, 평면도와 추가 요청사항은 선택 항목이며, 제출 시 별도 선택 동의를 받습니다.</p>
          <h3>게시물</h3>
          <p>게시판 운영과 게시물 표시를 위해 게시물 내용, 사진, 사진별 장소명, 작성 시각과 작성자 계정 연결 정보를 처리합니다. 게시물과 사진은 공개 페이지에 표시됩니다.</p>
        </section>

        <section>
          <h2>2. 보유 및 이용 기간</h2>
          <ul>
            <li>회원 계정: 회원 탈퇴 시까지. 탈퇴 시 로그인 계정은 삭제합니다. 다만 작성한 공개 게시물과 사진은 유지하고 작성자 계정 연결을 해제합니다.</li>
            <li>상담 신청: 상담 완료 처리일부터 1년간 보관한 뒤 신청 정보와 첨부 파일을 삭제합니다. 관계 법령에 따라 보존할 의무가 있는 경우에는 해당 정보만 별도 보관합니다.</li>
            <li>게시물: 작성자 또는 관리자가 삭제할 때까지 공개 상태로 보관합니다. 회원 탈퇴만으로 게시물과 사진은 삭제되지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2>3. 처리 위탁 및 국외 처리</h2>
          <p>회원 인증, 데이터베이스, 파일 저장과 서비스 운영을 위해 Supabase Pte. Ltd.에 개인정보 처리를 위탁합니다. 핵심 데이터베이스·인증·저장 파일은 Supabase 프로젝트 리전에 저장됩니다. 프로젝트 리전은 <strong>{supabaseRegion}</strong>입니다.</p>
          <p>Supabase는 서비스 운영·지원 과정에서 제한된 데이터에 대한 국외 접근·처리와 운영 로그 처리를 할 수 있습니다. Supabase가 공개한 자료에 따르면 처리 위치에는 싱가포르, 미국, 유럽연합 내 데이터센터와 이용자 접속 위치에 따른 글로벌 CDN이 포함될 수 있으며, Supabase, Inc. 및 재수탁자가 관여할 수 있습니다. 대상 정보는 계정·서비스 운영 정보, 보안·성능 로그와 지원 요청 시 필요한 데이터이며, 운영·보안·지원 및 파일 전송 목적으로 네트워크를 통해 처리됩니다. 보유 기간은 서비스 계약 및 해당 서비스의 운영·로그 정책에 따릅니다.</p>
          <p>국외 처리는 서비스 계약 이행에 필요한 처리 위탁·보관으로 수행하며, 이 방침을 통해 관련 사항을 공개합니다. 국외 처리를 거부하면 Supabase 기반 회원·상담·게시물 기능 이용이 제한될 수 있습니다. 수탁자와 재수탁자 및 처리 위치는 변경될 수 있으므로 <a href='https://supabase.com/legal/customer-resources/subprocessor-list' target='_blank' rel='noreferrer'>Supabase 재수탁자 목록</a>과 <a href='https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq' target='_blank' rel='noreferrer'>데이터 위치 안내</a>를 함께 확인해 주세요.</p>
        </section>

        <section>
          <h2>4. 정보주체의 권리와 행사 방법</h2>
          <p>정보주체는 개인정보 열람, 정정, 삭제와 처리 정지를 요청할 수 있습니다. 회원 계정과 게시물은 마이페이지 또는 게시물 관리 기능을 이용할 수 있으며, 상담 정보와 그 밖의 요청은 아래 연락처로 문의해 주세요. 운영자는 요청자의 본인 여부를 확인한 뒤 관계 법령에 따라 처리합니다.</p>
        </section>

        <section>
          <h2>5. 파기 절차와 방법</h2>
          <p>보유 기간이 끝나거나 처리 목적을 달성한 개인정보는 지체 없이 파기합니다. 전자 파일과 첨부 파일은 복구할 수 없도록 삭제하며, 법령상 보존이 필요한 정보는 다른 정보와 분리하여 보관합니다.</p>
        </section>

        <section>
          <h2>6. 안전성 확보 조치</h2>
          <p>상담 신청 내역과 평면도 파일은 관리자 권한이 확인된 계정만 조회하도록 접근을 제한합니다. 계정과 권한을 관리하고, 서비스 및 저장소의 접근 권한을 필요한 범위로 운영합니다.</p>
        </section>

        <section>
          <h2>7. 자동 수집 정보</h2>
          <p>로그인 상태 유지를 위해 인증 세션 정보가 이용자의 브라우저 저장소에 보관됩니다. 브라우저에서 로그아웃하거나 세션이 만료되면 사용할 수 없게 됩니다. 이 사이트 코드에서는 광고·분석 쿠키를 설정하지 않습니다.</p>
        </section>

        <section>
          <h2>8. 개인정보 문의</h2>
          <p>운영자: 새롬 인테리어 · 대표 김명열</p>
          <p>개인정보 보호책임자: 김명열 대표</p>
          <p>주소: 강원특별자치도 원주시 늘품로 126 (단구동)</p>
          <p>연락처: <a href='tel:010-4991-9060'>010-4991-9060</a>, <a href='tel:010-2563-6855'>010-2563-6855</a></p>
        </section>
      </article>
    </main>
  </>
)

export default PrivacyPolicy
