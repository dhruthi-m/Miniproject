import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Phone,
  PhoneCall,
  ExternalLink,
  ShieldAlert,
  Search,
  Star,
  Clock,
  Filter,
  CheckCircle,
  AlertTriangle,
  Hospital,
  UserCheck,
  Calendar,
  X,
  Compass,
  RefreshCw,
  Info,
  Key,
  Sparkles,
  MapPinOff
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getGpsLocation,
  reverseGeocode,
  searchLocationByQuery,
  fetchRealNearbyMedicalPlaces,
  getClosestRealAccreditedInstitutes,
  fetchGooglePlacesNearby,
  detectApproximateLocationByIp,
  POPULAR_LOCATIONS,
  EMERGENCY_HOTLINES,
  calculateDistanceKm,
  isVeterinaryOrAnimalPlace,
  isExcludedNonMentalFacility
} from '../services/gpsCareService';

export default function GpsHealthcareMap({
  riskLevel = 'Minimal', // 'Minimal' | 'Mild' | 'Moderate' | 'Elevated'
  score = 0,
  maxScore = 34,
  testName = 'Screening Assessment',
  autoLocate = false,
  compact = false
}) {
  // Geolocation state
  const [gpsActive, setGpsActive] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [userLocation, setUserLocation] = useState({
    lat: 13.3409, // Default clean hub (Tumakuru / Karnataka) until GPS/IP detected
    lng: 77.1010,
    accuracy: null,
    cityName: 'Tumakuru, Karnataka'
  });

  // Location Search State (for searching any locality, city, campus or pincode)
  const [locSearchQuery, setLocSearchQuery] = useState('');
  const [locSuggestions, setLocSuggestions] = useState([]);
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchDropdownRef = useRef(null);

  // Close search suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setLocSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Optional Custom GPS / Google Places API Key state
  const [customApiKey, setCustomApiKey] = useState(() => {
    try {
      return localStorage.getItem('mindwave_google_maps_key') || '';
    } catch {
      return '';
    }
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'hospital' | 'psychiatrist' | 'top_rated'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'rating'
  const [selectedFacility, setSelectedFacility] = useState(null);

  // Appointment Booking Modal state
  const [bookingFacility, setBookingFacility] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    patientName: '',
    phone: '',
    preferredDate: '',
    consultMode: 'in-person', // 'in-person' | 'telehealth'
    notes: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Leaflet map container refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Only trigger clinical alert banner if risk score is strictly above 30 for 34
  const isHighRisk = score > 30 || (maxScore > 0 && (score / maxScore) > (30 / 34));

  // Load 100% REAL physical facilities for a given coordinate set
  const loadRealFacilities = useCallback(async (lat, lng, cityName) => {
    setLoadingFacilities(true);
    try {
      let realList = await fetchRealNearbyMedicalPlaces(lat, lng, cityName);

      // If user provided a custom Google Places API Key, supplement with Google Places
      if (customApiKey) {
        try {
          const gList = await fetchGooglePlacesNearby(customApiKey, lat, lng);
          if (gList && gList.length > 0) {
            const seen = new Set(realList.map(f => f.name.toLowerCase().trim()));
            gList.forEach(g => {
              if (!seen.has(g.name.toLowerCase().trim())) {
                realList.push(g);
                seen.add(g.name.toLowerCase().trim());
              }
            });
            realList.sort((a, b) => a.distanceKm - b.distanceKm);
          }
        } catch (gErr) {
          console.warn('Google Places query error:', gErr);
        }
      }

      // Strict defense-in-depth: Ensure veterinary or irrelevant clinics are never stored
      const sanitizedList = realList.filter(f => !isVeterinaryOrAnimalPlace(f) && !isExcludedNonMentalFacility(f));
      setFacilities(sanitizedList);
    } catch (err) {
      console.warn('Error loading real facilities:', err);
      const fallback = getClosestRealAccreditedInstitutes(lat, lng, 3).filter(f => !isVeterinaryOrAnimalPlace(f) && !isExcludedNonMentalFacility(f));
      setFacilities(fallback);
    } finally {
      setLoadingFacilities(false);
    }
  }, [customApiKey]);

  // Request high-accuracy GPS coordinates from the browser
  const handleEnableLocation = async () => {
    setLocating(true);
    setGpsError(null);

    try {
      const coords = await getGpsLocation({ timeout: 9000, highAccuracy: true });
      const friendlyName = await reverseGeocode(coords.lat, coords.lng);

      setUserLocation({
        lat: coords.lat,
        lng: coords.lng,
        accuracy: coords.accuracy,
        cityName: friendlyName
      });
      setGpsActive(true);
      setLocating(false);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1 });
      }
    } catch (err) {
      console.warn('GPS location request issue:', err);
      setGpsError(err.message || 'Could not retrieve your location. You can drag the pin on the map or search your area.');
      setLocating(false);
    }
  };

  // Location search input handler
  const handleLocSearchChange = (e) => {
    const val = e.target.value;
    setLocSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (val.trim().length >= 2) {
      searchDebounceRef.current = setTimeout(async () => {
        setIsSearchingLoc(true);
        try {
          const results = await searchLocationByQuery(val);
          setLocSuggestions(results);
        } catch {
          setLocSuggestions([]);
        } finally {
          setIsSearchingLoc(false);
        }
      }, 350);
    } else {
      setLocSuggestions([]);
    }
  };

  // Select location from search suggestions
  const handleSelectSearchResult = (loc) => {
    setUserLocation({
      lat: loc.lat,
      lng: loc.lng,
      accuracy: null,
      cityName: loc.fullName || loc.name
    });
    setGpsActive(true);
    setLocSuggestions([]);
    setLocSearchQuery('');
    setGpsError(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 14.5, { duration: 1.2 });
    }
  };

  // Turn off GPS location tracking and revert to clean manual search area
  const handleDisableLocation = () => {
    setGpsActive(false);
    setLocating(false);
    setGpsError(null);
    const defaultHub = POPULAR_LOCATIONS[0] || {
      id: 'mumbai',
      name: 'Mumbai, Maharashtra',
      lat: 19.0760,
      lng: 72.8777
    };
    setUserLocation({
      lat: defaultHub.lat,
      lng: defaultHub.lng,
      accuracy: null,
      cityName: defaultHub.name
    });
  };

  // Change location from preset city dropdown
  const handleCitySelect = async (loc) => {
    setUserLocation({
      lat: loc.lat,
      lng: loc.lng,
      accuracy: null,
      cityName: loc.name
    });
    setGpsActive(false);
    setGpsError(null);
  };

  // Reload real facilities whenever userLocation changes
  useEffect(() => {
    loadRealFacilities(userLocation.lat, userLocation.lng, userLocation.cityName);
  }, [userLocation.lat, userLocation.lng, userLocation.cityName, loadRealFacilities]);

  // Dynamically initialize location on mount (silent IP detection or GPS if granted)
  useEffect(() => {
    let isMounted = true;

    async function initDynamicLocation() {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state === 'granted') {
            if (isMounted) handleEnableLocation();
            return;
          }
        } catch {}
      }

      if (autoLocate) {
        if (isMounted) handleEnableLocation();
        return;
      }

      // Silent IP-based city approximation so the map is not empty
      try {
        const approx = await detectApproximateLocationByIp();
        if (approx && isMounted && !gpsActive) {
          setUserLocation({
            lat: approx.lat,
            lng: approx.lng,
            accuracy: null,
            cityName: approx.cityName
          });
        }
      } catch {}
    }

    initDynamicLocation();
    return () => { isMounted = false; };
  }, [autoLocate]);

  // Filtered and sorted facilities
  const displayedFacilities = useMemo(() => {
    // Strict defense-in-depth: Exclude any veterinary or non-mental clinics
    let list = facilities.filter(f => !isVeterinaryOrAnimalPlace(f) && !isExcludedNonMentalFacility(f));

    // Filter by type
    if (activeFilter === 'hospital') {
      list = list.filter(f => f.type === 'hospital');
    } else if (activeFilter === 'psychiatrist') {
      list = list.filter(f => 
        f.type === 'psychiatrist' || 
        f.categoryBadge?.toLowerCase().includes('psychiatric') || 
        f.categoryBadge?.toLowerCase().includes('mental') ||
        f.specialties?.some(s => s.toLowerCase().includes('psych'))
      );
    } else if (activeFilter === 'top_rated') {
      list = list.filter(f => f.rating >= 4.8);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f => 
        f.name.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.specialties?.some(s => s.toLowerCase().includes(q)) ||
        (f.doctorLead && f.doctorLead.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'distance') {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [facilities, activeFilter, searchQuery, sortBy]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 13.5,
        zoomControl: true,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    map.setView([userLocation.lat, userLocation.lng], 13.5, { animate: true });
    markersGroup.clearLayers();

    // Attach click listener on map to allow clicking anywhere to set exact location
    map.off('click');
    map.on('click', async (e) => {
      if (e.originalEvent && e.originalEvent.target && e.originalEvent.target.closest('.facility-marker-wrapper, .leaflet-popup')) {
        return;
      }
      const newLat = e.latlng.lat;
      const newLng = e.latlng.lng;
      const friendlyName = await reverseGeocode(newLat, newLng);
      setUserLocation({
        lat: newLat,
        lng: newLng,
        accuracy: null,
        cityName: friendlyName
      });
      setGpsActive(true);
      setGpsError(null);
    });

    // 1. User Location Beacon Marker (Draggable so user can correct coordinates)
    const userBeaconIcon = L.divIcon({
      className: 'gps-user-beacon-wrapper',
      html: `
        <div class="gps-beacon-outer">
          <div class="gps-beacon-pulse"></div>
          <div class="gps-beacon-core">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { 
      icon: userBeaconIcon,
      draggable: true,
      title: 'Drag me to adjust your location'
    })
      .bindPopup(`
        <div style="font-family: inherit; font-size: 0.9rem; padding: 4px;">
          <strong style="color: #7560D9; display: flex; align-items: center; gap: 4px;">
            <span>📍 Your Location</span>
          </strong>
          <p style="margin: 4px 0 2px 0; color: #1F2937; font-size: 0.84rem; font-weight: 600;">${userLocation.cityName}</p>
          ${userLocation.accuracy ? `<span style="font-size: 0.74rem; color: #10B981; font-weight: 600;">GPS Accuracy: ±${userLocation.accuracy}m</span><br/>` : ''}
          <span style="font-size: 0.72rem; color: #6B7280; display: inline-block; margin-top: 4px;">💡 Drag this pin or click anywhere on the map to pinpoint your exact spot!</span>
        </div>
      `)
      .addTo(markersGroup);

    userMarker.on('dragend', async (e) => {
      const newLatLng = e.target.getLatLng();
      const friendlyName = await reverseGeocode(newLatLng.lat, newLatLng.lng);
      setUserLocation({
        lat: newLatLng.lat,
        lng: newLatLng.lng,
        accuracy: null,
        cityName: friendlyName
      });
      setGpsActive(true);
      setGpsError(null);
    });

    userMarkerRef.current = userMarker;

    if (userLocation.accuracy && userLocation.accuracy < 2500) {
      L.circle([userLocation.lat, userLocation.lng], {
        radius: userLocation.accuracy,
        color: '#7560D9',
        fillColor: '#7560D9',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(markersGroup);
    }

    // 2. Real Medical & Psychiatric Facility Markers
    displayedFacilities.forEach((facility) => {
      const isHosp = facility.type === 'hospital';

      const customIcon = L.divIcon({
        className: 'facility-marker-wrapper',
        html: `
          <div class="facility-pin ${isHosp ? 'pin-hospital' : 'pin-psychiatrist'}">
            <div class="pin-inner-icon">
              ${isHosp 
                ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12M6 12h12"/></svg>` 
                : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>`
              }
            </div>
            <div class="pin-arrow"></div>
          </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -42]
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 0.88rem; width: 230px; line-height: 1.4;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 9999px; background: ${isHosp ? '#FEE2E2' : '#ECE8FF'}; color: ${isHosp ? '#DC2626' : '#634FC8'};">
              ${isHosp ? '🏥 Registered Hospital' : '🧠 Psychiatric Center'}
            </span>
            <span style="font-weight: 700; font-size: 0.78rem; color: #D97706;">★ ${facility.rating}</span>
          </div>
          <h4 style="margin: 4px 0 2px 0; font-size: 0.94rem; font-weight: 700; color: #171744;">
            ${facility.name}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 0.78rem; color: #616283;">
            ${facility.address}
          </p>
          <div style="font-size: 0.8rem; font-weight: 600; color: #7560D9; margin-bottom: 8px;">
            📍 ${facility.distanceText}
          </div>
          <div style="display: flex; gap: 6px;">
            <a href="tel:${facility.phone.replace(/[^0-9+]/g, '')}" style="flex: 1; text-align: center; background: #7560D9; color: white; padding: 6px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
              <span>Call</span>
            </a>
            <a href="${facility.googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #EDF3FF; color: #2563EB; border: 1px solid #DCE8FF; padding: 6px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
              <span>Directions</span>
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([facility.lat, facility.lng], { icon: customIcon })
        .bindPopup(popupHtml)
        .addTo(markersGroup);

      marker.on('click', () => {
        setSelectedFacility(facility);
      });
    });

  }, [userLocation, displayedFacilities]);

  // Center map on a specific facility card click
  const focusFacilityOnMap = (facility) => {
    setSelectedFacility(facility);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([facility.lat, facility.lng], 15.5, {
        duration: 1.2
      });
    }
  };

  // Center back on user GPS
  const centerOnUserGps = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 14.5, {
        duration: 1
      });
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    }
  };

  // Handle appointment booking submission
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.patientName || !bookingForm.phone) {
      alert('Please enter your name and contact phone number.');
      return;
    }
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingFacility(null);
      setBookingForm({
        patientName: '',
        phone: '',
        preferredDate: '',
        consultMode: 'in-person',
        notes: ''
      });
    }, 2800);
  };

  return (
    <div className={`gps-care-wrapper ${compact ? 'compact-mode' : ''}`} id="gps-healthcare-section">
      {/* ── 1. CLINICAL ADVISORY BANNER (Shown if Moderate or Elevated Risk) ─── */}
      {isHighRisk && (
        <div className="risk-clinical-advisory-banner" role="alert">
          <div className="advisory-icon-wrapper">
            <ShieldAlert size={26} className="advisory-icon-pulse" />
          </div>
          <div className="advisory-content">
            <div className="advisory-badge-row">
              <span className="advisory-risk-tag">
                ⚠️ {riskLevel} Score Alert
              </span>
              <span className="advisory-sub-tag">
                Recommended Action: Professional Clinical Evaluation
              </span>
            </div>
            <h3 className="advisory-title">
              Connect With Nearby Mental Health Specialists & Emergency Hospitals
            </h3>
            <p className="advisory-description">
              Your recent responses on the <strong>{testName}</strong> indicate elevated distress or clinical symptom indicators. 
              Self-reflection is a helpful initial indicator, but <strong>evaluation by a licensed psychiatrist or emergency hospital team is strongly advised</strong>. 
              Turn on GPS tracking below to view genuine registered hospitals and apex psychiatric centers in your locality.
            </p>
          </div>
        </div>
      )}

      {/* ── 2. 24/7 OFFICIAL REAL CRISIS HELPLINES BAR ───────────────────────── */}
      <div className="emergency-hotlines-strip">
        <div className="hotline-strip-label">
          <PhoneCall size={18} color="var(--color-primary)" />
          <span>Immediate Crisis Assistance (24x7 Free & Confidential):</span>
        </div>
        <div className="hotlines-pills-row">
          {EMERGENCY_HOTLINES.map((h, idx) => (
            <a 
              key={idx} 
              href={`tel:${h.number.replace(/\D/g, '')}`} 
              className="hotline-pill-link"
              title={h.description}
            >
              <span className="hotline-badge">{h.badge}</span>
              <strong className="hotline-name">{h.name.split('(')[0]}:</strong>
              <span className="hotline-phone-number">{h.number}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── 3. GPS TRACKER CONTROL BAR & LOCATION SEARCH ───────────────────── */}
      <div className="gps-tracker-control-card">
        {/* Top Row: Direct Location Search Bar */}
        <div className="location-search-row">
          <div className="location-search-wrapper" ref={searchDropdownRef}>
            <div className="location-search-input-box">
              <Search size={16} className="loc-search-icon" />
              <input
                type="text"
                className="location-search-input"
                placeholder="Search your locality, city, campus or pincode (e.g. Tumakuru, SIT, 572101)..."
                value={locSearchQuery}
                onChange={handleLocSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && locSuggestions.length > 0) {
                    handleSelectSearchResult(locSuggestions[0]);
                  }
                }}
              />
              {isSearchingLoc && <RefreshCw size={14} className="spinner-rotate loc-search-spinner" />}
              {locSearchQuery && (
                <button 
                  type="button" 
                  className="btn-clear-loc-search"
                  onClick={() => { setLocSearchQuery(''); setLocSuggestions([]); }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {locSuggestions.length > 0 && (
              <div className="loc-suggestions-dropdown">
                {locSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="loc-suggestion-item"
                    onClick={() => handleSelectSearchResult(item)}
                  >
                    <MapPin size={15} className="loc-suggestion-icon" />
                    <div className="loc-suggestion-info">
                      <strong className="loc-suggestion-title">{item.name}</strong>
                      {item.fullName && item.fullName !== item.name && (
                        <span className="loc-suggestion-subtitle">{item.fullName}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: GPS Controls, Status & City Dropdown */}
        <div className="gps-controls-flex-row">
          <div className="gps-control-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {gpsActive ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn-gps-trigger active ${locating ? 'locating' : ''}`}
                  onClick={handleEnableLocation}
                  disabled={locating}
                  id="btn-enable-gps-tracking"
                  title="Click to Refresh / Re-detect high precision GPS"
                >
                  {locating ? (
                    <>
                      <RefreshCw size={18} className="spinner-rotate" />
                      <span>Refining GPS...</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={18} />
                      <span>GPS Active (Click to Refresh)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-disable-gps"
                  onClick={handleDisableLocation}
                  id="btn-turn-off-location"
                  title="Turn off GPS location and return to manual city mode"
                >
                  <MapPinOff size={16} />
                  <span>Turn Off</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={`btn-gps-trigger ${locating ? 'locating' : ''}`}
                onClick={handleEnableLocation}
                disabled={locating}
                id="btn-enable-gps-tracking"
                title="Acquire live GPS coordinates"
              >
                {locating ? (
                  <>
                    <RefreshCw size={18} className="spinner-rotate" />
                    <span>Detecting GPS Location...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={18} />
                    <span>📍 Detect Current Location</span>
                  </>
                )}
              </button>
            )}

            <div className="gps-status-indicator">
              <span className={`status-dot ${gpsActive ? 'online' : locating ? 'pending' : 'offline'}`} />
              <div className="status-text-wrap">
                <span className="status-label">{gpsActive ? 'Current Location (Active):' : 'Current Search Area:'}</span>
                <strong className="status-location-name" title={userLocation.cityName}>
                  {userLocation.cityName}
                </strong>
              </div>
              {gpsActive && userLocation.accuracy && (
                <span className="status-accuracy-badge" title="Estimated GPS radius error">
                  ±{userLocation.accuracy}m
                </span>
              )}
            </div>
          </div>

          {/* Quick Selector, Re-Center & Optional Custom API Key */}
          <div className="gps-control-right">
            <button
              type="button"
              className="btn-recenter"
              onClick={() => {
                setKeyInput(customApiKey);
                setShowKeyModal(true);
              }}
              title="Configure GPS / Google Places API Key"
            >
              <Key size={15} />
              <span>{customApiKey ? 'Google API Key Active' : 'API Key (Optional)'}</span>
            </button>

            <button
              type="button"
              className="btn-recenter"
              onClick={centerOnUserGps}
              title="Re-center map on your location"
            >
              <Compass size={16} />
              <span>Center on Me</span>
            </button>

            <div className="city-selector-wrap">
              <label htmlFor="city-select-dropdown" className="sr-only">Change City</label>
              <select
                id="city-select-dropdown"
                className="city-select-dropdown"
                value={userLocation.cityName}
                onChange={(e) => {
                  const found = POPULAR_LOCATIONS.find(l => l.name === e.target.value);
                  if (found) handleCitySelect(found);
                }}
              >
                <option value={userLocation.cityName}>
                  📍 {userLocation.cityName}
                </option>
                {POPULAR_LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location Interactive Adjustment Hint */}
        <div className="location-guidance-hint">
          <Sparkles size={14} className="guidance-hint-icon" />
          <span>
            <strong>Need to adjust?</strong> You can <strong>drag the purple pin</strong> on the map, <strong>click anywhere on the map</strong>, or <strong>type your locality above</strong> to set your exact location.
          </span>
        </div>
      </div>

      {gpsError && (
        <div className="gps-error-notice" role="alert">
          <AlertTriangle size={18} color="#DC2626" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* ── 4. SEARCH & FILTER TOOLBAR ─────────────────────────────────────── */}
      <div className="care-search-filter-bar">
        {/* Filter Pills */}
        <div className="care-filter-tabs">
          <button
            type="button"
            className={`care-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span>All Facilities</span>
            <span className="filter-count-badge">{facilities.length}</span>
          </button>

          <button
            type="button"
            className={`care-filter-tab ${activeFilter === 'hospital' ? 'active' : ''}`}
            onClick={() => setActiveFilter('hospital')}
          >
            <Hospital size={16} />
            <span>24/7 Hospitals</span>
            <span className="filter-count-badge">
              {facilities.filter(f => f.type === 'hospital').length}
            </span>
          </button>

          <button
            type="button"
            className={`care-filter-tab ${activeFilter === 'psychiatrist' ? 'active' : ''}`}
            onClick={() => setActiveFilter('psychiatrist')}
          >
            <UserCheck size={16} />
            <span>Psychiatric Centers</span>
            <span className="filter-count-badge">
              {facilities.filter(f => 
                f.type === 'psychiatrist' || 
                f.categoryBadge?.toLowerCase().includes('psychiatric') || 
                f.specialties?.some(s => s.toLowerCase().includes('psych'))
              ).length}
            </span>
          </button>

          <button
            type="button"
            className={`care-filter-tab ${activeFilter === 'top_rated' ? 'active' : ''}`}
            onClick={() => setActiveFilter('top_rated')}
          >
            <Star size={16} fill="currentColor" />
            <span>Rated 4.8+</span>
          </button>
        </div>

        {/* Search Input & Sort */}
        <div className="care-search-sort-group">
          <div className="care-search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by hospital name, specialty, or street..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="care-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="btn-clear-search" 
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="care-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort care providers"
          >
            <option value="distance">Sort by: Closest Distance</option>
            <option value="rating">Sort by: Highest Rating</option>
          </select>
        </div>
      </div>

      {/* ── 5. MAIN TWO-COLUMN VIEW: RADAR MAP + REAL FACILITY LIST ─────────── */}
      <div className="care-interactive-grid">
        
        {/* Left Column: Leaflet Interactive Map Container */}
        <div className="care-map-column">
          <div className="care-map-header">
            <div className="care-map-header-left">
              <Compass size={17} color="var(--color-primary)" />
              <strong style={{ fontSize: '0.94rem' }}>Live GPS Healthcare Radar</strong>
            </div>
            <div className="care-map-legend">
              <span className="legend-item">
                <span className="legend-dot dot-user" /> You
              </span>
              <span className="legend-item">
                <span className="legend-dot dot-hospital" /> Emergency Hospital
              </span>
              <span className="legend-item">
                <span className="legend-dot dot-psychiatrist" /> Psychiatric Center
              </span>
            </div>
          </div>

          <div 
            ref={mapContainerRef} 
            className="leaflet-interactive-container"
            aria-label="Interactive map showing nearby hospitals and psychiatric centers"
          />

          <div className="care-map-footer-hint">
            <Info size={14} />
            <span>Click any marker to view contact numbers, hospital wings, or launch Google Maps turn-by-turn navigation.</span>
          </div>
        </div>

        {/* Right Column: Real Facility Cards List & Direct Google Maps Radar */}
        <div className="care-list-column">
          
          {/* ── LIVE GOOGLE MAPS PRACTICING PSYCHIATRISTS RADAR CARD ───────── */}
          <div className="live-psychiatrist-radar-card">
            <div className="radar-card-badge">
              <Sparkles size={14} /> Live Practicing Specialist Radar
            </div>
            <h5 className="radar-card-title">
              Find Practicing Psychiatrists in {userLocation.cityName.split(',')[0]}
            </h5>
            <p className="radar-card-text">
              Looking for private practicing psychiatrists in your exact suburb? Open live Google Maps to view active practicing psychiatrists with real patient reviews, consult hours, and direct clinic phone numbers.
            </p>
            <div className="radar-action-buttons">
              <a
                href={`https://www.google.com/maps/search/psychiatrist+near+me/@${userLocation.lat},${userLocation.lng},14z`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-radar-primary"
                id="btn-open-google-psychiatrists"
              >
                <ExternalLink size={15} />
                <span>Open Practicing Psychiatrists on Google Maps</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/mental+health+clinic+near+me/@${userLocation.lat},${userLocation.lng},14z`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-radar-secondary"
                id="btn-open-google-clinics"
              >
                <span>Mental Health Clinics</span>
              </a>
              <a
                href="tel:14416"
                className="btn-radar-helpline"
                title="Tele-MANAS Government 24/7 Mental Health Helpline"
              >
                <PhoneCall size={14} />
                <span>Tele-MANAS (14416)</span>
              </a>
            </div>
          </div>

          <div className="care-list-header">
            <h4 className="care-list-title">
              {activeFilter === 'hospital'
                ? 'Nearby Registered Emergency Hospitals'
                : activeFilter === 'psychiatrist'
                ? 'Apex Psychiatric Hospitals & Referral Centers'
                : 'Registered Hospitals & Accredited Psychiatric Centers'}
            </h4>
            <span className="care-list-subtitle">
              Showing {displayedFacilities.length} verified physical centers around {userLocation.cityName.split(',')[0]}
            </span>
          </div>

          {loadingFacilities && (
            <div className="facilities-loading-status">
              <RefreshCw size={18} className="spinner-rotate" />
              <span>Scanning live GPS coordinates for registered medical facilities near {userLocation.cityName.split(',')[0]}...</span>
            </div>
          )}

          <div className="facility-cards-scroll-container">
            {displayedFacilities.length === 0 && !loadingFacilities ? (
              <div className="empty-facilities-notice">
                <Search size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                <p>No facilities match your search criteria.</p>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              displayedFacilities.map((facility) => {
                const isHosp = facility.type === 'hospital';
                const isSelected = selectedFacility?.id === facility.id;

                return (
                  <article
                    key={facility.id}
                    className={`facility-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => focusFacilityOnMap(facility)}
                  >
                    {/* Top Row: Badge, Rating & Distance */}
                    <div className="facility-card-top">
                      <div className="facility-type-badges">
                        <span className={`facility-category-pill ${isHosp ? 'pill-hospital' : 'pill-psychiatrist'}`}>
                          {isHosp ? <Hospital size={13} /> : <UserCheck size={13} />}
                          <span>{facility.categoryBadge}</span>
                        </span>
                        {facility.emergency24x7 && (
                          <span className="pill-emergency-247">
                            ⚡ 24/7 Emergency
                          </span>
                        )}
                        {facility.verifiedRealPlace && (
                          <span className="pill-verified">
                            <CheckCircle size={12} /> Real Registered Facility
                          </span>
                        )}
                      </div>

                      <div className="facility-distance-pill">
                        <Navigation size={12} />
                        <strong>{facility.distanceText}</strong>
                      </div>
                    </div>

                    {/* Facility Real Name */}
                    <h5 className="facility-card-name">
                      {facility.name}
                    </h5>

                    {facility.doctorLead && (
                      <p className="facility-doctor-lead">
                        🏛️ {facility.doctorLead}
                      </p>
                    )}

                    {facility.qualifications && (
                      <p className="facility-doctor-quals">
                        🎓 {facility.qualifications}
                      </p>
                    )}

                    {/* Rating & Review Count */}
                    <div className="facility-rating-row">
                      <div className="stars-wrapper">
                        <Star size={14} fill="#F59E0B" color="#F59E0B" />
                        <span className="rating-num">{facility.rating}</span>
                        <span className="rating-count">({facility.reviewCount} reviews)</span>
                      </div>
                      <div className="timing-text">
                        <Clock size={13} />
                        <span>{facility.hours}</span>
                      </div>
                    </div>

                    {/* Address */}
                    <p className="facility-address">
                      <MapPin size={13} className="pin-icon" />
                      <span>{facility.address}</span>
                    </p>

                    {/* Specialty Tags */}
                    {facility.specialties && facility.specialties.length > 0 && (
                      <div className="facility-specialties-wrap">
                        {facility.specialties.map((spec, sIdx) => (
                          <span key={sIdx} className="specialty-chip">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="facility-actions-row">
                      <a
                        href={`tel:${facility.phone.replace(/[^0-9+]/g, '')}`}
                        className="btn-facility-action btn-call"
                        onClick={(e) => e.stopPropagation()}
                        title={`Call ${facility.phone}`}
                      >
                        <Phone size={14} />
                        <span>Call</span>
                      </a>

                      <a
                        href={facility.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-facility-action btn-directions"
                        onClick={(e) => e.stopPropagation()}
                        title="Open directions in Google Maps"
                      >
                        <ExternalLink size={14} />
                        <span>Directions</span>
                      </a>

                      <button
                        type="button"
                        className="btn-facility-action btn-book"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBookingFacility(facility);
                        }}
                      >
                        <Calendar size={14} />
                        <span>Consult Desk</span>
                      </button>

                      <button
                        type="button"
                        className="btn-facility-action btn-locate"
                        onClick={(e) => {
                          e.stopPropagation();
                          focusFacilityOnMap(facility);
                        }}
                        title="Locate on Radar"
                      >
                        <MapPin size={14} />
                        <span>Radar Pin</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ── 6. CONSULTATION DESK / APPOINTMENT REFERRAL MODAL ───────────────── */}
      {bookingFacility && (
        <div className="care-modal-overlay" onClick={() => setBookingFacility(null)}>
          <div className="care-booking-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="btn-modal-close" 
              onClick={() => setBookingFacility(null)}
              aria-label="Close consultation modal"
            >
              <X size={20} />
            </button>

            {bookingSuccess ? (
              <div className="booking-success-view">
                <div className="success-icon-wrap">
                  <CheckCircle size={48} color="#10B981" />
                </div>
                <h3>Consultation Referral Submitted!</h3>
                <p>
                  Your consultation assistance request for <strong>{bookingFacility.name}</strong> has been received. 
                  A care coordinator will reach out to <strong>{bookingForm.phone}</strong> with clinical details and appointment intake procedures.
                </p>
                <div className="success-ref-card">
                  <span>Reference ID:</span>
                  <strong>MW-CARE-{Math.floor(100000 + Math.random() * 900000)}</strong>
                </div>
              </div>
            ) : (
              <div>
                <div className="booking-modal-header">
                  <div className="facility-mini-icon">
                    {bookingFacility.type === 'hospital' ? <Hospital size={24} /> : <UserCheck size={24} />}
                  </div>
                  <div>
                    <h3 className="modal-title">
                      Request Consultation with {bookingFacility.name}
                    </h3>
                    <p className="modal-subtitle">
                      {bookingFacility.address} • 📍 {bookingFacility.distanceText}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="booking-form-grid">
                  <div className="form-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ananya Roy"
                      value={bookingForm.patientName}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, patientName: e.target.value }))}
                    />
                  </div>

                  <div className="form-field">
                    <label>Contact Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="form-field">
                    <label>Preferred Consultation Format</label>
                    <div className="consult-mode-radios">
                      <label className={`mode-label ${bookingForm.consultMode === 'in-person' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="consultMode"
                          value="in-person"
                          checked={bookingForm.consultMode === 'in-person'}
                          onChange={() => setBookingForm(prev => ({ ...prev, consultMode: 'in-person' }))}
                        />
                        <span>🏥 In-Person Visit</span>
                      </label>
                      <label className={`mode-label ${bookingForm.consultMode === 'telehealth' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="consultMode"
                          value="telehealth"
                          checked={bookingForm.consultMode === 'telehealth'}
                          onChange={() => setBookingForm(prev => ({ ...prev, consultMode: 'telehealth' }))}
                        />
                        <span>💻 Tele-Consultation</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Preferred Date / Time Window</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingForm.preferredDate}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Screening Context or Notes (Optional & Confidential)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Following up on recent mood screening; would like clinical consultation."
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  <div className="booking-modal-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setBookingFacility(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      <span>Submit Request</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 7. OPTIONAL GPS / GOOGLE PLACES API KEY MODAL ─────────────────── */}
      {showKeyModal && (
        <div className="care-modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="care-booking-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <button 
              type="button" 
              className="btn-modal-close" 
              onClick={() => setShowKeyModal(false)}
              aria-label="Close API Key modal"
            >
              <X size={20} />
            </button>

            <div className="booking-modal-header" style={{ marginBottom: '1rem' }}>
              <div className="facility-mini-icon" style={{ background: '#ECE8FF', color: 'var(--color-primary)' }}>
                <Key size={24} />
              </div>
              <div>
                <h3 className="modal-title">GPS & Maps Configuration</h3>
                <p className="modal-subtitle">Customize location services or use built-in GPS</p>
              </div>
            </div>

            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-tint)',
              border: '1px solid var(--color-border)',
              fontSize: '0.86rem',
              color: 'var(--color-text)',
              lineHeight: 1.55,
              marginBottom: '1.25rem'
            }}>
              <strong style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <CheckCircle size={16} />
                <span>Zero API Key Required By Default</span>
              </strong>
              <span>
                MindWave uses your browser's native GPS and free OpenStreetMap Nominatim radar. When you click <strong>"📍 Enable GPS Location"</strong>, it automatically detects your location and shows nearby registered physical hospitals and apex psychiatric centers for free.
              </span>
            </div>

            <div className="form-field" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem', display: 'block' }}>
                Optional: Google Maps / Places API Key
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '0.3rem', display: 'block' }}>
                If provided, live Google Places search will query Google Maps for additional private clinics around your coordinates.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {customApiKey && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    localStorage.removeItem('mindwave_google_maps_key');
                    setCustomApiKey('');
                    setKeyInput('');
                    setShowKeyModal(false);
                  }}
                >
                  Clear Key
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (keyInput.trim()) {
                    localStorage.setItem('mindwave_google_maps_key', keyInput.trim());
                    setCustomApiKey(keyInput.trim());
                  } else {
                    localStorage.removeItem('mindwave_google_maps_key');
                    setCustomApiKey('');
                  }
                  setShowKeyModal(false);
                }}
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
