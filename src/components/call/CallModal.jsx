import './CallModal.css'
import InfoDiv from './InfoDiv';
import { useNavigate } from 'react-router-dom';
import { toKoreaTime } from '../../utils/utils';
import KakaoMap from './KaKaoMap';

const CallModal = () => {
  const navigate = useNavigate();

  return <>
    <div className='call-modal'>
      <div>
        <h3>신고가 정상적으로 접수되었습니다.</h3>
        <div style={{display: 'flex', gap: '15px'}}>
          <div style={{width: '50%'}}>
            <InfoDiv title='주소' text='서울 강서구 화곡동 980-16' />
            <InfoDiv title='장소' text='강서구청' />
            <InfoDiv title='신고시각' text='2024-07-19 오후 05:25' />
            <InfoDiv title='접수 내용' text='불이 크게 일고 있고 사람들이 숨을 쉬지 못하는 상황입니다.' />
          </div>
          <div className='map'>
            <KakaoMap />
          </div>
        </div>
        <button onClick={() => navigate('/')}>홈 화면으로 나가기</button>
      </div>
    </div>
  </>
}

export default CallModal;