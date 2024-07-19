import styled from 'styled-components';
import { getUser } from '../../apis/user';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';


import Chart from './chart/Chart';
import UserComponent from "./UserComponent";
import CalendarComponent from './CalendarComponent';
import NoticeComponent from './NoticeComponent';

const BodyContainer = styled.div`
  position: relative;
  width: 1200px;
  height: 800px;
  padding: 40px 0;
  margin: 0 auto;
`;

const CalendarWrapper = styled.div`
  position: absolute;
  width: 800px;
  height: 450px;
  background-color: #D5D9DB55;
  border-radius: 15px;
  padding: 20px;
  box-sizing: border-box;
`;

const UserInfoContainer = styled.div`
  position: absolute;
  left: 850px;
  width: 350px;
  height: 200px;
  background-color: #D5D9DB55;
  border-radius: 15px;
  padding: 20px;
  box-sizing: border-box;
`;

const StatsContainer = styled.div`
  position: absolute;
  top: 280px;
  left: 850px;
  width: 350px;
  height: 450px;
  background-color: #D5D9DB55;
  border-radius: 15px;
  padding: 20px;
  box-sizing: border-box;
`;


const Body = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('')

  useEffect(() => {
    getUser().then((res) => {
      if (res) setName(res.name);
      else navigate('/login');
    })
  }, [])

  return (
    <BodyContainer>
      <CalendarWrapper>
        <CalendarComponent />
      </CalendarWrapper>
      <UserInfoContainer>
        <UserComponent name={name}/>
      </UserInfoContainer>
      <NoticeComponent />
      <StatsContainer>
        <Chart />
      </StatsContainer>
    </BodyContainer>
  );
};

export default Body;
