import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Main from "./pages/Main";
import Report from "./pages/Report";
import Report2 from "./pages/Report2";
import Report3 from "./pages/Report3";
import Report4 from "./pages/Report4";
import Login from "./pages/login/Login";
import Write from "./pages/notification/Write";
import FindID from './pages/findID/FindID';
import SignUp from './pages/signup/SignUp';
import ChangePW from './pages/changePW/changePW';
import CallReport from './pages/callReport/CallReport'
import ReportDetails from "./pages/callReport/ReportDetails";
import NoticePost from "./pages/notification/NoticePost";
import NoticeList from "./pages/notification/NoticeList";
import { SocketProvider } from './pages/SocketContext';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/main' element={<Main />} />
          
          <Route path='/report' element={<Report />} />
          <Route path='/report2' element={<Report2 />} />
          <Route path='/report3' element={<Report3 />} />
          <Route path='/report4' element={<Report4 />} />
      
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path="/findid" element={<FindID />} />
          <Route path="/changepw" element={<ChangePW />} />
          <Route path="/notice" element={<NoticeList />} />
          <Route path='/notice/:id' element={<NoticePost />} />
          <Route path='/notice/write' element={<Write />} />
          <Route path='/notice/write/:id' element={<Write />} />
          <Route path='/callreport' element={<CallReport />} />
          <Route path='/reportdetails/:id' element={<ReportDetails />} />
        </Routes>
        </SocketProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
