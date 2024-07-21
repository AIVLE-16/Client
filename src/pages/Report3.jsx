import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const MapNaverWithInfoPanel = () => {
  const mapElement = useRef(null);
  const [locations, setLocations] = useState([]);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [socket, setSocket] = useState(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.REACT_APP_API_KEY}`;
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.body.appendChild(script);

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => {
      document.body.removeChild(script);
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit('request_initial_locations');

    const intervalId = setInterval(() => {
      socket.emit('request_locations');
    }, 5000);

    socket.on('locations_update', (data) => {
      console.log('Received locations update:', data);
      setLocations(data);
    });

    return () => {
      clearInterval(intervalId);
      socket.off('locations_update');
    };
  }, [socket]);

  const updateMarkers = useCallback((map, newLocations) => {
    const { naver } = window;

    // 기존 마커 제거
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 새 마커 생성
    newLocations.forEach((location) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(location.lat, location.lng),
        map: map,
      });

      const infoWindow = new naver.maps.InfoWindow({
        content: `<div><h3>${location.name}</h3><p>${location.description}</p></div>`
      });

      naver.maps.Event.addListener(marker, 'click', () => {
        if (infoWindow.getMap()) {
          infoWindow.close();
        } else {
          infoWindow.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // 초기 로드 시에만 지도 범위 조정
    if (isInitialLoad && newLocations.length > 0) {
      const bounds = new naver.maps.LatLngBounds();
      newLocations.forEach(location => {
        bounds.extend(new naver.maps.LatLng(location.lat, location.lng));
      });
      map.fitBounds(bounds);
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  const fitBoundsToMarkers = useCallback(() => {
    if (!mapRef.current || markersRef.current.length === 0) return;

    const bounds = new window.naver.maps.LatLngBounds();
    markersRef.current.forEach(marker => {
      bounds.extend(marker.getPosition());
    });
    mapRef.current.fitBounds(bounds);
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !mapElement.current || !window.naver) return;

    const { naver } = window;

    if (!mapRef.current) {
      const mapOptions = {
        center: new naver.maps.LatLng(37.5656, 126.9769),
        zoom: 12,
        zoomControl: true,
      };
      mapRef.current = new naver.maps.Map(mapElement.current, mapOptions);
    }

    updateMarkers(mapRef.current, locations);
  }, [locations, isScriptLoaded, updateMarkers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <h1>Naver Map - Multiple Locations</h1>
          <div ref={mapElement} style={{ height: '400px' }} />
          <button onClick={fitBoundsToMarkers} style={{ marginTop: '10px' }}>
            모든 마커 보기
          </button>
        </div>
        <div style={{ flex: 1, marginLeft: '20px', overflowY: 'auto', maxHeight: '400px' }}>
          <h2>Location Information</h2>
          {locations.map((location, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
              <h3>{location.name}</h3>
              <p>Latitude: {location.lat}</p>
              <p>Longitude: {location.lng}</p>
              <p>Place: {location.place}</p>
              <p>Description: {location.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapNaverWithInfoPanel;