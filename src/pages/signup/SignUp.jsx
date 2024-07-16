import axios from 'axios';
import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { FullContainer, GoBackBtn } from '../../components/CommonStyles';

import { getCookie } from '../../utils/cookie';
import { blockSpace } from '../../utils/keyboard';

import './SignUp.css';
import { errorWithoutBtn, successWithoutBtn, warningWithoutBtn } from '../../utils/swal';

axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

function Signup() {
  const [id, setId] = useState('');
  const [idDuplicated, setIdDuplicated] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [code, setCode] = useState('');
  const [confirmed, setConfirmed] = useState(false); // 이메일 인증 완료 여부
  const [authNumVisible, setAuthNumVisible] = useState(false);

  // email 인증번호 확인
  // const handleAuthNumCheck = async () => {
  //   try {
  //     const response = await axios.post('/', { email, code }); // api 주소
  //     if (response.data.isValid) {
  //       Swal.fire({
  //         icon: 'success',
  //         title: '인증번호가 확인되었습니다',
  //         showConfirmButton: true
  //       });
  //     } else {
  //       Swal.fire({
  //         icon: 'error',
  //         title: '인증번호가 올바르지 않습니다',
  //         showConfirmButton: true
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error checking auth number:', error);
  //     Swal.fire({
  //       icon: 'error',
  //       title: '인증번호 확인에 실패했습니다',
  //       showConfirmButton: true
  //     });
  //   }
  // };
   
  // 아이디 중복 검사
  const onIdChange = (e) => {
    setId(e.target.value);

    const csrftoken = getCookie('csrftoken');
    axios.post('http://localhost:8000/account/idcheck/', {'id': e.target.value}, {
      headers: {
        'X-CSRFToken': csrftoken
      }
    })
    .then((res) => {
      if (res.data.valid) setIdDuplicated(false);
      else setIdDuplicated(true);
    })
    .catch((error) => {
      console.log(error)
    })
  };

  // 이메일 인증 버튼 클릭
  const onEmailClick = () => {
    // 이메일 유효성 검사
    // 코드 작성하기~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    const csrftoken = getCookie('csrftoken');
    
    // 이메일 중복 검사
    axios.post('http://localhost:8000/account/emailcheck/', {'email': email}, {
      headers: {
        'X-CSRFToken': csrftoken
      }
    })
    .then((res) => {
      // 이메일 중복 검사 성공
      if (!res.data.valid) errorWithoutBtn('이미 가입된 이메일입니다.');
      else {
        // 이메일 인증코드 보내는 api 호출
        axios.post('http://localhost:8000/account/sendemail/', {'email': email}, {
          headers: {
            'X-CSRFToken': csrftoken
          }
        })
        .then((res) => {
          // 이메일 발송 성공
          console.log(res);
          successWithoutBtn('인증번호가 발송되었습니다.');
          setAuthNumVisible(true);
        })
        .catch((error) => {
          // 이메일 발송 실패
          console.log(error);
          errorWithoutBtn('이메일 발송에 실패하였습니다.', '잠시후 다시 시도해주세요.');
        })
      }
    })
    .catch((error) => {
      // 이메일 중복 확인 실패
      console.log(error);
      errorWithoutBtn('알 수 없는 오류가 발생하였습니다.', '잠시후 다시 시도해주세요.');
    })
  }

  // 인증 코드 확인
  const onClickAuthBtn = () => {
    const csrftoken = getCookie('csrftoken');
    axios.post('http://localhost:8000/account/checksignupcode/', {email, code}, {
      headers: {
        'X-CSRFToken': csrftoken
      }
    })
    .then((res) => {
      console.log(res.data)
      setConfirmed(true);
    })
    .catch((error) => {
      console.log(error);
    })
  }
  
  // 가입하기 버튼
  const handleSubmit = async () => {
    if (!name || !id || !password || !confirmPassword || !email) {
      warningWithoutBtn('모든 정보를 입력해주세요.');
      return;
    } else if (!confirmed) {
      warningWithoutBtn('이메일 인증을 완료해주세요.');
      return;
    } else if (password !== confirmPassword) {
      errorWithoutBtn('비밀번호가 일치하지 않습니다.')
      return;
    }

    try {
      const response = await axios.post('/', { name, id, password, email, code });
      if (response.data.success) {
        
        Swal.fire({
          icon: 'success',
          title: '회원가입에 성공했습니다',
          showConfirmButton: true
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: '회원가입에 실패했습니다',
          text: response.data.message,
          showConfirmButton: true
        });
      }
    } catch (error) {
      console.error('Error during signup:', error);
      Swal.fire({
        icon: 'error',
        title: '회원가입 중 오류가 발생했습니다',
        showConfirmButton: true
      });
    }
  };

  useEffect(() => {
    // csrf token 가져오기
    axios.get('http://localhost:8000/account/signup/')
  }, [])

  return (
    <FullContainer>
      <div className="signupContainer">
        <video autoPlay muted loop id="background-video">
          <source src="/videos/firetruck.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <GoBackBtn />
        <div className="backContainer">
          <h4>회원가입</h4>
            <form onSubmit={handleSubmit}>
              <div>
                <div className="inlineFieldContainer">
                  <div className="fieldContainer">
                    <p><label htmlFor="name">name</label></p>
                    <input placeholder="이름" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      onKeyDown={blockSpace} 
                    />
                  </div>
                  <div className="fieldContainer">
                    <p><label htmlFor="id">id</label></p>
                    <input 
                      value={id}
                      placeholder="아이디"
                      onChange={onIdChange}
                      onKeyDown={blockSpace}
                    />
                    <div className='msg' style={{color: idDuplicated ? 'red' : 'green'}}>
                      { id && (idDuplicated ? '이미 사용중인 아이디입니다.' : '사용 가능한 아이디입니다.')}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="fieldContainer">
                    <label htmlFor="password">pw</label>
                    <input type="password" 
                      placeholder="비밀번호" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      onKeyDown={blockSpace}
                    />
                    <input type="password" 
                      placeholder="비밀번호 재확인" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      onKeyDown={blockSpace} 
                    />
                  </div>
                </div>
                <div>
                  <div style={{paddingTop: '10px'}}>
                    <label htmlFor="email">e-mail</label>
                    <div class='emailContainer'>
                      <input
                        placeholder="이메일" 
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={blockSpace}
                      />
                      <button type="button" onClick={onEmailClick}>인증</button>
                    </div>
                  </div>
                  {authNumVisible &&
                  <div className="authNumContainer">
                    <input className='authNum' 
                      placeholder="인증번호" 
                      value={code} 
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={blockSpace}
                    />
                    <button type="button" onClick={onClickAuthBtn}>확인</button>
                  </div>}
                </div>
              </div>
            </form>
          <button type="submit" className="submitBtn" onClick={handleSubmit}>가입하기</button>
        </div>
      </div>
    </FullContainer>
  )
}

export default Signup;
