import { getNotice } from '../../../apis/notification';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './NoticeComponent.css'

const NoticeComponent = () => {
  const navigate = useNavigate();
  const [notice, setNotice] = useState([]);

  useEffect(() => {
    getNotice().then((res) => setNotice(res.slice(0, 3)));
  }, [])

  return (
    <div className='notice-wrapper'>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <h3>최신 공지 사항</h3>
        <button onClick={() => navigate('/notice')}><span>+</span></button>
      </div>
      <div className='table-wrapper'>
        <table>
          <tr>
            <th style={{width: '40px'}}>id</th>
            <th>제목</th>
            <th style={{width:'200px'}}>날짜</th>
          </tr>
          {notice.map((n) => 
            <tr onClick={() => navigate('/notice/' + n.pk)}>
              <td>{n.pk}</td>
              <td>{n.fields.title}</td>
              <td>{n.fields.created_at.slice(0, 10)}</td>
            </tr>
          )}
        </table>
      </div>
    </div>
  )
}

export default NoticeComponent;