/* Hyperlocal Source Explorer. Static page: every call goes straight from the browser to the data provider. */
'use strict';
var enc=encodeURIComponent;
var IN_BROWSER=(typeof window!=='undefined');
/* ---------- catalogue ---------- */
var CATS=[
 {id:'weather',name:'Weather',blurb:'Forecasts, nowcasts and radar.'},
 {id:'air',name:'Air and environment',blurb:'Pollution, pollen and sensors near you.'},
 {id:'water',name:'Water and flooding',blurb:'Rivers, rain gauges, tides and sewage.'},
 {id:'energy',name:'Energy',blurb:'Grid carbon, generation, tariffs and power cuts.'},
 {id:'transport',name:'Transport',blurb:'Buses, trains, bikes, roads, fuel and charging.'},
 {id:'overhead',name:'Overhead and offshore',blurb:'Aircraft and ships.'},
 {id:'places',name:'Places and civic',blurb:'Geocoding, nearby things, crime, planning and local reports.'},
 {id:'news',name:'Local news',blurb:'Feeds that can be narrowed to a place name.'},
 {id:'social',name:'Live and social',blurb:'Posts, streams, photos, cameras and events.'},
 {id:'hazard',name:'Hazards',blurb:'Warnings and natural events.'},
 {id:'sky',name:'Sky and space',blurb:'Daylight, aurora and satellites.'},
 {id:'nature',name:'Nature',blurb:'Wildlife sightings near you.'},
 {id:'context',name:'Calendar context',blurb:'Holidays and other time anchors.'}
];
var SRC=[];
/* add(category,id,name,scope,auth,freshness,evidence,lean,description,{u,docs,note}) */
function add(cat,id,name,scope,auth,fresh,ev,lean,desc,o){var s=o||{};s.cat=cat;s.id=id;s.name=name;s.scope=scope;s.auth=auth;s.fresh=fresh;s.ev=ev;s.lean=lean;s.desc=desc;SRC.push(s)}
function bb(c,d){return {w:+(c.lon-d).toFixed(4),s:+(c.lat-d).toFixed(4),e:+(+c.lon+d).toFixed(4),n:+(+c.lat+d).toFixed(4)}}
function slug(c){return String(c.place||'').toLowerCase().replace(/[^a-z0-9]/g,'')}

/* weather */
add('weather','om-forecast','Open-Meteo forecast','Global','open','live','r','keep','Current conditions, 15-minute rain and an hourly forecast for any coordinates.',{
  u:function(c){return 'https://api.open-meteo.com/v1/forecast?latitude='+c.lat+'&longitude='+c.lon+'&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,wind_gusts_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m&minutely_15=precipitation&forecast_minutely_15=8&forecast_days=2&timezone=auto'},
  docs:'https://open-meteo.com/en/docs',note:'Free for non-commercial use, about 10,000 calls a day. 15-minute data is native in Central Europe and North America and interpolated elsewhere.'});
add('weather','om-ukmo','Open-Meteo on the Met Office UK model','UK','open','hourly','r','keep','The same API pinned to the Met Office 2 km UK model.',{
  u:function(c){return 'https://api.open-meteo.com/v1/forecast?latitude='+c.lat+'&longitude='+c.lon+'&models=ukmo_seamless&current=temperature_2m,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation&forecast_hours=6&timezone=auto'},
  docs:'https://open-meteo.com/en/docs/ukmo-api',note:'Compare against the global call above. Is the 2 km model visibly better where you are?'});
add('weather','metno-loc','MET Norway Locationforecast','Global','open','hourly','m','maybe','Global point forecast from the Norwegian Met Institute.',{
  u:function(c){return 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat='+c.lat+'&lon='+c.lon},
  docs:'https://api.met.no/weatherapi/locationforecast/2.0/documentation',note:'Requires an identifying User-Agent, which browsers cannot set from code, so a proxy is needed. The link works because the browser sends its own.'});
add('weather','metno-now','MET Norway Nowcast','Nordics','open','live','m','maybe','Radar-based 5-minute rain nowcast, Nordic countries only.',{
  u:function(c){return 'https://api.met.no/weatherapi/nowcast/2.0/complete?lat='+c.lat+'&lon='+c.lon},
  docs:'https://api.met.no/weatherapi/nowcast/2.0/documentation',note:'Returns an error outside the Nordic radar area. Useful as a yardstick for what a good nowcast looks like.'});
add('weather','dh-spot','Met Office DataHub: Global Spot','UK','key','hourly','r','maybe','Official hourly, 3-hourly and daily forecasts for the nearest of 45,000 sites.',{
  docs:'https://datahub.metoffice.gov.uk',note:'Free plan is 360 calls a day, so cache by site. DataPoint was retired on 1 December 2025; old tutorials are wrong.'});
add('weather','mo-warn','Met Office weather warnings','UK','key','live','r','keep','National Severe Weather Warnings as polygons.',{
  docs:'https://datahub.metoffice.gov.uk/support/faqs',note:'Free up to 20,000 calls a day. Warning polygons need a point-in-polygon check against your location.'});
add('weather','nws-points','US National Weather Service forecast','US','open','hourly','r','scrap','Gridpoint forecast and hourly data, public domain.',{
  u:function(c){return 'https://api.weather.gov/points/'+c.lat+','+c.lon},
  docs:'https://www.weather.gov/documentation/services-web-api',note:'US only. Needs a custom User-Agent. Switch the place to New York to test it.'});
add('weather','nws-alerts','US NWS alerts','US','open','live','r','scrap','Active CAP alerts for a point.',{
  u:function(c){return 'https://api.weather.gov/alerts/active?point='+c.lat+','+c.lon},docs:'https://www.weather.gov/documentation/services-web-api',note:'US only.'});
add('weather','rainviewer','RainViewer radar','Global','open','live','m','maybe','Global radar mosaic frames for rain animation.',{
  u:function(){return 'https://api.rainviewer.com/public/weather-maps.json'},docs:'https://www.rainviewer.com/api.html',note:'Free terms were tightened in 2025. Check zoom limits and whether nowcast frames still come back.'});
add('weather','brightsky','Bright Sky (German weather service)','Germany','open','hourly','m','scrap','Open wrapper around DWD observations and forecasts.',{
  u:function(c){return 'https://api.brightsky.dev/current_weather?lat='+c.lat+'&lon='+c.lon},docs:'https://brightsky.dev/docs/',note:'Germany only. Useful only if the experiment travels.'});
add('weather','wttr','wttr.in','Global','open','hourly','m','scrap','A friendly text and JSON weather wrapper.',{
  u:function(c){return 'https://wttr.in/'+c.lat+','+c.lon+'?format=j1'},docs:'https://github.com/chubin/wttr.in',note:'A hobby service wrapping other data. Little reason to prefer it over Open-Meteo.'});

/* air */
add('air','om-aq','Open-Meteo air quality and pollen','Global','open','hourly','r','keep','Modelled PM, NO₂, ozone, UV index, European AQI and six pollen types.',{
  u:function(c){return 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude='+c.lat+'&longitude='+c.lon+'&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,uv_index&hourly=alder_pollen,birch_pollen,grass_pollen&forecast_days=1&timezone=auto'},
  docs:'https://open-meteo.com/en/docs/air-quality-api',note:'About 11 km grid over Europe, so this is a model, not a measurement. Pollen is European and in season only.'});
add('air','sensorcomm','Sensor.Community','Global','open','live','r','keep','Citizen air sensors: PM2.5, PM10, temperature, humidity and noise, at exact coordinates.',{
  u:function(c){return 'https://data.sensor.community/airrohr/v1/filter/area='+c.lat+','+c.lon+',15'},
  docs:'https://github.com/opendata-stuttgart/meta/wiki/EN-APIs',note:'Read from data.sensor.community, not api.sensor.community. Coverage is the question: none within 5 km of central Windsor, six within 15 km.'});
add('air','openaq','OpenAQ v3','Global','key','hourly','r','maybe','Government and low-cost sensor measurements near a point.',{
  docs:'https://docs.openaq.org',note:'API key in the X-API-Key header, 60 calls a minute. v1 and v2 return HTTP 410.'});
add('air','ukair-sos','UK-AIR sensor observation service','UK','open','hourly','r','maybe','Defra automatic monitoring stations, including AURN.',{
  u:function(c){return 'https://uk-air.defra.gov.uk/sos-ukair/api/v1/stations?limit=5'},
  docs:'https://uk-air.defra.gov.uk/data/about_sos',note:'Marked beta. Returns the national station list, so filter by distance yourself.'});
add('air','londonair','London Air (Imperial)','London','open','hourly','m','maybe','London and South East monitoring index by site.',{
  u:function(){return 'https://api.erg.ic.ac.uk/AirQuality/Daily/MonitoringIndex/Latest/GroupName=London/Json'},docs:'https://www.londonair.org.uk',note:'Endpoint path from memory.'});
add('air','airnow','US EPA AirNow','US','key','hourly','m','scrap','US AQI observations and forecasts.',{docs:'https://docs.airnowapi.org',note:'US only.'});
add('air','purpleair','PurpleAir','Global','paid','live','m','scrap','Dense low-cost PM sensors, strongest in the US.',{docs:'https://develop.purpleair.com',note:'Paid points system. Sensor.Community covers the same ground for free.'});

/* water */
add('water','ea-floods','Environment Agency flood warnings','UK','open','live','r','keep','Flood alerts and warnings with the areas they cover.',{
  u:function(c){return 'https://environment.data.gov.uk/flood-monitoring/id/floods?lat='+c.lat+'&long='+c.lon+'&dist=20'},
  docs:'https://environment.data.gov.uk/flood-monitoring/doc/reference',note:'No key. Needs the attribution: “This uses Environment Agency flood and river level data from the real-time data API (Beta)”.'});
add('water','ea-levels','Environment Agency river level gauges','UK','open','live','r','keep','River gauges near you, such as the Thames at Windsor or the Wey at Guildford.',{
  u:function(c){return 'https://environment.data.gov.uk/flood-monitoring/id/stations?parameter=level&lat='+c.lat+'&long='+c.lon+'&dist=10'},
  docs:'https://environment.data.gov.uk/flood-monitoring/doc/reference',note:'Readings are taken every 15 minutes, but many sites upload only once or twice a day in calm weather, so “latest” can be hours old. Open a station’s measures link to see the latest value.'});
add('water','ea-rain','Environment Agency rain gauges','UK','open','live','r','keep','About 1,000 tipping-bucket gauges with 15-minute totals.',{
  u:function(c){return 'https://environment.data.gov.uk/flood-monitoring/id/stations?parameter=rainfall&lat='+c.lat+'&long='+c.lon+'&dist=15'},
  docs:'https://environment.data.gov.uk/flood-monitoring/doc/rainfall',note:'Gauge location is snapped to a 100 m grid.'});
add('water','ea-tide','Environment Agency tide gauges','UK','open','live','r','maybe','Real-time tide levels at coastal and estuary gauges.',{
  u:function(){return 'https://environment.data.gov.uk/flood-monitoring/id/stations?type=TideGauge&_limit=10'},docs:'https://environment.data.gov.uk/flood-monitoring/doc/tidegauge',note:'Not relevant inland.'});
add('water','storm-ovf','Storm overflow spills','UK','open','live','r','keep','Near-real-time status of all 14,187 storm overflows in England, from the water companies.',{
  docs:'https://www.streamwaterdata.co.uk/pages/storm-overflows-data',note:'Per-company ArcGIS feature services. Thames Water covers Windsor and much of Surrey. Data is unvalidated. The exact query endpoint still has to be located.'});
add('water','bathing','Bathing water quality (EA)','UK','open','daily','m','maybe','Designated bathing sites with sample results and pollution-risk forecasts.',{
  docs:'https://environment.data.gov.uk/bwq/',note:'Linked-data API. Check whether any designated sites are near you.'});
add('water','admiralty','UKHO Admiralty tidal API','UK','key','daily','m','maybe','Tidal predictions for about 600 UK ports.',{docs:'https://admiraltyapi.portal.azure-api.net',note:'Free discovery tier with a key.'});
add('water','usgs-water','USGS water services','US','open','live','m','scrap','US stream flow and gauge height.',{
  u:function(c){var b=bb(c,0.25);return 'https://waterservices.usgs.gov/nwis/iv/?format=json&bBox='+b.w+','+b.s+','+b.e+','+b.n+'&parameterCd=00065&siteStatus=active'},
  docs:'https://waterservices.usgs.gov',note:'US only. The legacy service is migrating to api.waterdata.usgs.gov.'});
add('water','noaa-tides','NOAA tides and currents','US','open','live','m','scrap','US water levels and predictions by station.',{
  u:function(){return 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=water_level&station=9414290&date=latest&datum=MLLW&time_zone=gmt&units=metric&format=json'},
  docs:'https://api.tidesandcurrents.noaa.gov/api/prod/',note:'Fixed to the San Francisco station as an example of the format.'});
add('water','om-marine','Open-Meteo marine','Global','open','hourly','r','maybe','Wave height, swell and sea temperature.',{
  u:function(c){return 'https://marine-api.open-meteo.com/v1/marine?latitude='+c.lat+'&longitude='+c.lon+'&current=wave_height,wave_period,sea_surface_temperature'},
  docs:'https://open-meteo.com/en/docs/marine-weather-api',note:'Coastal points only; inland coordinates return an error.'});
add('water','om-flood','Open-Meteo flood (GloFAS)','Global','open','daily','r','maybe','Modelled river discharge forecast.',{
  u:function(c){return 'https://flood-api.open-meteo.com/v1/flood?latitude='+c.lat+'&longitude='+c.lon+'&daily=river_discharge&forecast_days=7'},
  docs:'https://open-meteo.com/en/docs/flood-api',note:'About 5 km model. Compare with the real EA gauges.'});

/* energy */
add('energy','ci-nat','Carbon Intensity, national','UK','open','live','r','keep','Half-hourly carbon intensity of the GB grid with a 96-hour forecast.',{
  u:function(){return 'https://api.carbonintensity.org.uk/intensity'},docs:'https://carbon-intensity.github.io/api-definitions/',note:'No key. CC BY 4.0.'});
add('energy','ci-reg','Carbon Intensity, by postcode','UK','open','live','r','keep','The same, for the regional area containing your outward postcode.',{
  u:function(c){return c.pc?'https://api.carbonintensity.org.uk/regional/postcode/'+enc(c.pc):null},
  docs:'https://carbon-intensity.github.io/api-definitions/',note:'Despite the postcode lookup, the result is one of 17 regional forecasts, not a measurement at your postcode.'});
add('energy','ci-gen','Carbon Intensity, generation mix','UK','open','live','r','maybe','Current share of gas, wind, solar, nuclear and imports.',{
  u:function(){return 'https://api.carbonintensity.org.uk/generation'},docs:'https://carbon-intensity.github.io/api-definitions/',note:'Nice for a compact stacked-bar tile.'});
add('energy','elexon','Elexon BMRS generation outturn','UK','open','live','m','maybe','GB generation by fuel type and system data.',{
  u:function(){return 'https://data.elexon.co.uk/bmrs/api/v1/generation/outturn/summary?format=json'},docs:'https://bmrs.elexon.co.uk/api-documentation',note:'Endpoint from memory.'});
add('energy','pvlive','Sheffield Solar PV_Live','UK','open','live','m','maybe','Estimated solar PV output, national and by region.',{docs:'https://www.solar.sheffield.ac.uk/pvlive',note:'Endpoint to be located.'});
add('energy','octopus','Octopus Energy tariffs','UK','open','daily','m','maybe','Agile and Tracker unit rates by region; half-hourly prices.',{
  u:function(){return 'https://api.octopus.energy/v1/products/?brand=OCTOPUS_ENERGY'},docs:'https://developer.octopus.energy',note:'Region J is South East. Product codes change regularly.'});
add('energy','emaps','Electricity Maps','Global','key','live','m','scrap','Grid carbon intensity for zones worldwide.',{docs:'https://www.electricitymaps.com',note:'Free tier is limited and non-commercial.'});
add('energy','powercuts','Power cuts (SSEN and UK Power Networks)','UK','unknown','live','m','maybe','Live outage lists from the distribution networks.',{
  docs:'https://ukpowernetworks.opendatasoft.com',note:'UK Power Networks has open data but covers London and the East. Windsor and Surrey are mostly SSEN, with no confirmed public API.'});

/* transport */
add('transport','bods','Bus Open Data Service','UK','key','live','r','keep','Live bus positions every 10 seconds (SIRI-VM and GTFS-RT) with a bounding-box filter, plus timetables.',{
  docs:'https://data.bus-data.dft.gov.uk',note:'Free key. GTFS-RT is protobuf, so decode it on a server. England only.'});
add('transport','darwin','Darwin live rail boards','UK','key','live','r','keep','Live departures, arrivals and train details by station.',{
  docs:'https://raildata.org.uk',note:'Keys now come from the Rail Data Marketplace; old OpenLDBWS tokens were retired in early 2026. Attribution required.'});
add('transport','tfl-status','TfL line status','London','open','live','r','maybe','Tube, DLR, Overground and Elizabeth line status.',{
  u:function(){return 'https://api.tfl.gov.uk/Line/Mode/tube,dlr,overground,elizabeth-line/Status'},docs:'https://api.tfl.gov.uk',note:'50 requests a minute without a key. Attribution: Powered by TfL Open Data.'});
add('transport','tfl-stops','TfL nearby stops','London','open','static','r','maybe','Bus stops and stations within 500 m of a point.',{
  u:function(c){return 'https://api.tfl.gov.uk/StopPoint?lat='+c.lat+'&lon='+c.lon+'&stopTypes=NaptanPublicBusCoachTram&radius=500'},docs:'https://api.tfl.gov.uk',note:'Greater London only.'});
add('transport','tfl-road','TfL road disruptions','London','open','live','r','maybe','Live disruptions on London’s main roads.',{
  u:function(){return 'https://api.tfl.gov.uk/Road/all/Disruption'},docs:'https://api.tfl.gov.uk',note:'Greater London only.'});
add('transport','tfl-bike','TfL Santander Cycles dock','London','open','live','r','maybe','Bike and empty-dock counts at a docking station.',{
  u:function(){return 'https://api.tfl.gov.uk/BikePoint/BikePoints_1'},docs:'https://api.tfl.gov.uk',note:'Sample is a single dock. The full list is large.'});
add('transport','gbfs','GBFS bike and scooter feeds','Global','open','live','r','keep','Open standard for dock and vehicle availability. Hundreds of cities.',{
  u:function(){return 'https://raw.githubusercontent.com/MobilityData/gbfs/master/systems.csv'},docs:'https://github.com/MobilityData/gbfs',note:'The link is the catalogue of systems. Check whether any scheme runs near you.'});
add('transport','mobdb','Mobility Database catalogue','Global','open','daily','r','maybe','Index of over 6,000 GTFS, GTFS-RT and GBFS feeds in 100+ countries.',{
  u:function(){return 'https://files.mobilitydatabase.org/feeds_v2.csv'},docs:'https://mobilitydatabase.org',note:'The CSV needs no token; the API needs a free account.'});
add('transport','transitland','Transitland','Global','key','live','m','maybe','Aggregated GTFS and GTFS-RT with REST and GraphQL.',{docs:'https://www.transit.land',note:'Free tier with a key.'});
add('transport','nh-datex','National Highways (DATEX II)','UK','key','live','m','maybe','Strategic road network incidents, roadworks and journey times (M25, M3, M4, A3).',{
  docs:'https://developer.data.nationalhighways.co.uk',note:'Free key. Best candidate for live road incidents near Surrey.'});
add('transport','streetmgr','DfT Street Manager','England','key','hourly','r','maybe','Every street and road work permit, with coordinates.',{
  docs:'https://www.gov.uk/guidance/find-and-use-roadworks-data',note:'Hourly export and push notifications; British National Grid coordinates. Suits a backend, not a phone page.'});
add('transport','digitraffic','Digitraffic (Finland)','Finland','open','live','m','scrap','Road traffic messages from the Finnish transport agency.',{
  u:function(){return 'https://tie.digitraffic.fi/api/traffic-message/v1/messages?inactiveHours=0&includeAreaGeometry=false&situationType=TRAFFIC_ANNOUNCEMENT'},docs:'https://www.digitraffic.fi/en/',note:'Included as an example of what a good national feed looks like.'});
add('transport','fuel','GOV.UK Fuel Finder','UK','oauth','live','r','keep','Statutory per-forecourt fuel prices, updated within 30 minutes of a change.',{
  docs:'https://www.gov.uk/guidance/access-fuel-price-data',note:'OAuth through GOV.UK One Login. Fair-use rules ban selective display. Coverage is still maturing; some sites report nothing.'});
add('transport','ocm','Open Charge Map','Global','key','daily','m','maybe','Crowdsourced EV charger registry with some status data.',{
  u:function(c){return 'https://api.openchargemap.io/v3/poi/?output=json&latitude='+c.lat+'&longitude='+c.lon+'&distance=3&maxresults=10'},docs:'https://openchargemap.org/site/develop/api',note:'Now wants a free key, so the link may be refused. CC BY-SA.'});
add('transport','ocpi','UK chargepoint operator OCPI feeds','UK','unknown','live','r','scrap','Statutory open data from each public chargepoint operator, with availability.',{
  docs:'https://www.legislation.gov.uk/uksi/2023/1168',note:'The national registry closed on 28 November 2024. Data is now per operator, which is fragmented.'});
add('transport','tomtom','TomTom traffic incidents','Global','paid','live','r','maybe','Incident feed refreshed every minute.',{
  docs:'https://developer.tomtom.com/traffic-api/documentation/traffic-incidents/traffic-incidents-service',note:'A free evaluation exists but limits were not confirmed.'});
add('transport','here','HERE traffic','Global','paid','live','r','maybe','Incidents and flow, updated about every two minutes.',{
  docs:'https://docs.here.com/traffic-api/docs/here-traffic-api-v7-concepts',note:'Free-tier limits not confirmed.'});

/* overhead */
add('overhead','opensky','OpenSky Network','Global','open','live','m','keep','Aircraft state vectors inside a bounding box. Heathrow approaches pass over Windsor.',{
  u:function(c){var b=bb(c,0.4);return 'https://opensky-network.org/api/states/all?lamin='+b.s+'&lomin='+b.w+'&lamax='+b.n+'&lomax='+b.e},
  docs:'https://openskynetwork.github.io/opensky-api',note:'Anonymous use is tightly rate-limited and non-commercial.'});
add('overhead','adsblol','adsb.lol','Global','open','live','m','keep','Community ADS-B within 25 nautical miles of a point.',{
  u:function(c){return 'https://api.adsb.lol/v2/point/'+c.lat+'/'+c.lon+'/25'},docs:'https://api.adsb.lol',note:'Open data, no key.'});
add('overhead','airplanes','airplanes.live','Global','open','live','m','maybe','Another community ADS-B feed with the same query shape.',{
  u:function(c){return 'https://api.airplanes.live/v2/point/'+c.lat+'/'+c.lon+'/25'},docs:'https://airplanes.live',note:'Good for cross-checking adsb.lol.'});
add('overhead','ais','AISstream','Global','key','live','m','maybe','Live ship positions over WebSocket.',{docs:'https://aisstream.io',note:'Coastal and tidal waters only. Free key. Thames traffic may be thin.'});

/* places */
add('places','nominatim','Nominatim reverse geocoding','Global','open','static','r','keep','Turns coordinates into an address and place hierarchy.',{
  u:function(c){return 'https://nominatim.openstreetmap.org/reverse?lat='+c.lat+'&lon='+c.lon+'&format=jsonv2&zoom=16'},docs:'https://nominatim.org/release-docs/latest/api/Reverse/',note:'One request a second, identify your app, no bulk use. Cache hard.'});
add('places','postcodes','postcodes.io reverse lookup','UK','open','static','r','keep','Coordinates to postcode, ward, council, LSOA and constituency.',{
  u:function(c){return 'https://api.postcodes.io/postcodes?lon='+c.lon+'&lat='+c.lat+'&limit=3&radius=500'},docs:'https://postcodes.io',note:'No key. The backbone for joining UK datasets.'});
add('places','postcodes-out','postcodes.io outward code','UK','open','static','r','maybe','Centre point and areas for an outward postcode such as SL4.',{
  u:function(c){return c.pc?'https://api.postcodes.io/outcodes/'+enc(c.pc):null},docs:'https://postcodes.io',note:'Needs the postcode field above.'});
add('places','bdc','BigDataCloud client-side reverse geocode','Global','open','static','m','maybe','Free reverse geocoding intended for browsers.',{
  u:function(c){return 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+c.lat+'&longitude='+c.lon+'&localityLanguage=en'},docs:'https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api',note:'A softer alternative to Nominatim for a place name.'});
add('places','ipwho','IP-based location','Global','open','static','m','maybe','Rough location from the connection, as a fallback when GPS is not available.',{
  u:function(){return 'https://ipwho.is/'},docs:'https://ipwhois.io',note:'City level at best. This page cannot read GPS, so this is how to find your starting point.'});
add('places','om-geo','Open-Meteo geocoding','Global','open','static','r','maybe','Place name to coordinates.',{
  u:function(c){return 'https://geocoding-api.open-meteo.com/v1/search?name='+enc(c.place)+'&count=3'},docs:'https://open-meteo.com/en/docs/geocoding-api',note:'Handy for a “change place” search box.'});
add('places','overpass','OpenStreetMap Overpass','Global','open','daily','r','keep','Any mapped feature near you: cafés, bus stops, defibrillators, benches.',{
  u:function(c){return 'https://overpass-api.de/api/interpreter?data='+enc('[out:json][timeout:15];node(around:400,'+c.lat+','+c.lon+')[amenity];out 15;')},docs:'https://wiki.openstreetmap.org/wiki/Overpass_API',note:'Keep under about 10,000 queries a day. ODbL licence. Opening hours exist but are patchy.'});
add('places','osmnotes','OpenStreetMap map notes','Global','open','live','m','maybe','Recent “this is wrong or missing” notes left on the map nearby.',{
  u:function(c){var b=bb(c,0.05);return 'https://api.openstreetmap.org/api/0.6/notes.json?bbox='+b.w+','+b.s+','+b.e+','+b.n+'&limit=10'},docs:'https://wiki.openstreetmap.org/wiki/API_v0.6#Map_Notes_API',note:'An odd but genuinely local signal.'});
add('places','wiki-geo','Wikipedia nearby articles','Global','open','static','m','keep','Articles about places within a radius.',{
  u:function(c){return 'https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord='+enc(c.lat+'|'+c.lon)+'&ggsradius=2000&ggslimit=8&prop=extracts%7Cpageimages%7Ccoordinates&exintro=1&explaintext=1&exsentences=3&exlimit=max&piprop=thumbnail&pithumbsize=240&colimit=max&format=json&formatversion=2&origin=*'},docs:'https://www.mediawiki.org/wiki/API:Geosearch',note:'Gives each tile a “story of this place” link.'});
add('places','commons','Wikimedia Commons nearby photos','Global','open','static','m','maybe','Geotagged freely licensed images near a point.',{
  u:function(c){return 'https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord='+enc(c.lat+'|'+c.lon)+'&ggsradius=1000&ggsnamespace=6&ggslimit=8&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=360&iiextmetadatafilter=LicenseShortName%7CArtist&format=json&formatversion=2&origin=*'},docs:'https://www.mediawiki.org/wiki/API:Geosearch',note:'Licence varies per image.'});
add('places','fsa','Food hygiene ratings (FSA)','UK','open','daily','r','maybe','Rating and score for about 600k food businesses, with coordinates.',{
  u:function(c){return 'https://api.ratings.food.gov.uk/Establishments?latitude='+c.lat+'&longitude='+c.lon+'&maxDistanceLimit=1&pageSize=10&sortOptionKey=distance'},docs:'https://api.ratings.food.gov.uk/help',note:'Needs an x-api-version: 2 header, so this link shows an error. Probed with the header it works, and the CORS preflight allows that header, so a browser can call it directly. Not time-sensitive.'});
add('places','planning','Planning Data constraints','England','open','daily','r','maybe','Conservation areas, listed buildings, flood zones and more at a point.',{
  u:function(c){return 'https://www.planning.data.gov.uk/entity.json?latitude='+c.lat+'&longitude='+c.lon+'&dataset=conservation-area'},docs:'https://www.planning.data.gov.uk/docs',note:'The planning-application dataset is marked not ready for use, and reports conflict on whether any records are usable.'});
add('places','police','data.police.uk street crime','UK','open','monthly','r','maybe','Street-level crimes within about a mile.',{
  u:function(c){return 'https://data.police.uk/api/crimes-street/all-crime?lat='+c.lat+'&lng='+c.lon},docs:'https://data.police.uk/docs/',note:'Monthly with a 1–2 month lag and anonymised snap points. Not live; suits a place-profile screen.'});
add('places','police-nh','Police neighbourhood lookup','UK','open','static','r','maybe','Which neighbourhood team covers a point.',{
  u:function(c){return 'https://data.police.uk/api/locate-neighbourhood?q='+c.lat+','+c.lon},docs:'https://data.police.uk/docs/method/neighbourhood-locate/',note:'No key.'});
add('places','fixmystreet','FixMyStreet reports','UK','open','live','m','keep','Recent potholes, fly-tipping and other issues reported near a point.',{
  u:function(c){return 'https://www.fixmystreet.com/rss/l/'+c.lat+','+c.lon},docs:'https://www.fixmystreet.com/about/api',note:'RSS around a location. A rare live, hyperlocal civic signal.'});
add('places','nyc311','NYC 311 requests (Socrata)','US','open','live','m','scrap','Latest service requests in New York, as an example of city open data.',{
  u:function(){return 'https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=5&$order='+enc('created_date DESC')},docs:'https://dev.socrata.com',note:'Shows the pattern for dozens of US cities. Not relevant in Surrey.'});
add('places','ofcom','Ofcom Connected Nations','UK','key','daily','m','scrap','Broadband and mobile coverage by postcode.',{docs:'https://api.ofcom.org.uk',note:'Static-ish. Not a live tile.'});
add('places','landreg','HM Land Registry price paid','UK','open','monthly','m','scrap','Every residential sale in England and Wales.',{docs:'https://landregistry.data.gov.uk',note:'Monthly. Only for a place-profile screen.'});
add('places','gias','Get Information About Schools','England','open','daily','m','scrap','Every school in England with location and capacity.',{docs:'https://get-information-schools.service.gov.uk',note:'CSV download. Not live.'});
add('places','nhs','NHS service search','England','key','daily','m','scrap','GPs, pharmacies and opening hours by postcode.',{docs:'https://digital.nhs.uk/developer',note:'Key needed. “Open now” pharmacies could be a useful tile.'});

/* news */
add('news','gdelt-doc','GDELT document search','Global','open','live','r','keep','News articles from worldwide sources, refreshed every 15 minutes, searchable by place name.',{
  u:function(c){return 'https://api.gdeltproject.org/api/v2/doc/doc?query='+enc('"'+c.place+'"')+'&mode=artlist&maxrecords=10&format=json&timespan=24h&sort=datedesc'},docs:'https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/',note:'No radius search; the name is matched as text. Expect noise for common place names.'});
add('news','gdelt-geo','GDELT geographic search','Global','open','live','r','maybe','The same news, grouped by location mentions.',{
  u:function(c){return 'https://api.gdeltproject.org/api/v2/geo/geo?query='+enc(c.place)+'&format=geojson&timespan=24h'},docs:'https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/',note:'One client library warns this API may be deprecated. A 404 would confirm it.'});
add('news','gnews','Google News search feed','Global','open','live','m','maybe','News search results for a place name, as RSS.',{
  u:function(c){return 'https://news.google.com/rss/search?q='+enc(c.place+' when:1d')+'&hl=en-GB&gl=GB&ceid=GB:en'},docs:'https://news.google.com/',note:'Unofficial, in a grey area on terms, and has no CORS headers. Headlines and links only.'});
add('news','bbc-berks','BBC News: Berkshire','UK','open','live','m','keep','Regional BBC feed covering Windsor.',{
  u:function(){return 'https://feeds.bbci.co.uk/news/england/berkshire/rss.xml'},docs:'https://www.bbc.co.uk/news/10628494',note:'RSS. Headlines and links only.'});
add('news','bbc-surrey','BBC News: Surrey','UK','open','live','m','keep','Regional BBC feed for Surrey.',{
  u:function(){return 'https://feeds.bbci.co.uk/news/england/surrey/rss.xml'},docs:'https://www.bbc.co.uk/news/10628494',note:'RSS. Headlines and links only.'});
add('news','localpress','Local papers (Maidenhead Advertiser, SurreyLive)','UK','unknown','live','m','maybe','Town-level stories.',{note:'No verified feed URLs yet. This board needs someone to find them or confirm there are none.'});

/* social */
add('social','masto-tag','Mastodon hashtag timeline','Global','open','live','m','keep','Recent public posts under a place hashtag, no login.',{
  u:function(c){return 'https://mastodon.social/api/v1/timelines/tag/'+slug(c)+'?limit=10'},docs:'https://docs.joinmastodon.org/methods/timelines/',note:'Posts carry no coordinates, so locality comes from the tag. Expect thin volume for small places.'});
add('social','masto-local','Mastodon local public timeline','Global','open','live','m','maybe','Everything posted on one server, in order.',{
  u:function(){return 'https://mastodon.social/api/v1/timelines/public?local=true&limit=10'},docs:'https://docs.joinmastodon.org/methods/timelines/',note:'Some servers now require login for public timelines. A regional server would make this genuinely local.'});
add('social','masto-regional','Regional Mastodon servers','Global','unknown','live','m','maybe','Community servers for a city or country that act as a local feed.',{
  docs:'https://joinmastodon.org/servers',note:'Needs someone to find a server that covers Surrey, Berkshire or London.'});
add('social','bsky-pub','Bluesky post search (public host)','Global','open','live','r','maybe','Keyword search for recent posts.',{
  u:function(c){return 'https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q='+enc(c.place)+'&sort=latest&limit=10'},docs:'https://docs.bsky.app/docs/api/app-bsky-feed-search-posts',note:'Docs say public; several reports say search is blocked on this host or needs auth. A 403 here is itself the finding.'});
add('social','bsky-app','Bluesky post search (api.bsky.app)','Global','open','live','r','maybe','The same search on the alternative host.',{
  u:function(c){return 'https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q='+enc(c.place)+'&sort=latest&limit=10'},docs:'https://docs.bsky.app/docs/api/app-bsky-feed-search-posts',note:'One report says this host works where the public one does not.'});
add('social','jetstream','Bluesky Jetstream firehose','Global','open','live','m','maybe','Every public post as it happens, over WebSocket, to filter yourself.',{
  docs:'https://docs.bsky.app/blog/jetstream',note:'No geo field, so filter on place names. Cannot run inside an artifact page; fine in a real app.'});
add('social','reddit','Reddit city subreddit','Global','unknown','live','r','maybe','Newest posts in a place’s subreddit.',{
  u:function(c){return 'https://www.reddit.com/r/'+slug(c)+'/new.json?limit=10'},docs:'https://www.reddit.com/wiki/api/',note:'Free API access reportedly needs approval for non-commercial use, at 100 requests a minute. Anonymous .json links are reported to return 403.'});
add('social','x','X (Twitter) API','Global','paid','live','r','scrap','Recent post search.',{
  docs:'https://docs.x.com',note:'Free tier is gone; reports say pay-per-use at about $0.005 per post read. Few posts are geotagged.'});
add('social','closed','Instagram, TikTok, Facebook, Nextdoor','Global','closed','live','m','scrap','The big local social networks.',{
  note:'No usable open location search for individuals. Listed so nobody wonders.'});
add('social','youtube','YouTube live streams nearby','Global','key','live','m','maybe','search.list with a location and radius, filtered to live events.',{
  docs:'https://developers.google.com/youtube/v3/docs/search/list',note:'Free key, 10,000 units a day, and each search costs 100, so about 100 searches a day.'});
add('social','flickr','Flickr geotagged photos','Global','key','hourly','m','maybe','Recently uploaded photos within a radius.',{
  docs:'https://www.flickr.com/services/api/flickr.photos.search.html',note:'Free key. Check licences before showing images.'});
add('social','windy','Windy webcams','Global','key','live','m','maybe','Live webcam stills near a point.',{
  docs:'https://api.windy.com/webcams',note:'Free key; image links expire after about 10 minutes. Many transport agencies also publish open traffic cameras.'});
add('social','ticketmaster','Ticketmaster Discovery','Global','key','daily','m','keep','Concerts, sport and theatre by point and radius.',{
  docs:'https://developer.ticketmaster.com',note:'Free key, about 5,000 calls a day. Eventbrite’s public search was withdrawn.'});
add('social','skiddle','Skiddle','UK','key','daily','m','maybe','UK club, gig and festival listings.',{docs:'https://www.skiddle.com/api',note:'Free key with terms.'});

/* hazards */
add('hazard','usgs-eq','USGS earthquakes','Global','open','live','m','maybe','Quakes within 1,000 km, newest first.',{
  u:function(c){return 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude='+c.lat+'&longitude='+c.lon+'&maxradiuskm=1000&orderby=time&limit=5'},docs:'https://earthquake.usgs.gov/fdsnws/event/1/',note:'Rarely relevant in Surrey, but reliable and a good travel tile.'});
add('hazard','gdacs','GDACS disaster alerts','Global','open','live','m','maybe','Global quake, cyclone and flood alerts.',{
  u:function(){return 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL&alertlevel=Green;Orange;Red'},docs:'https://www.gdacs.org',note:'Global scale; little use for hyperlocal.'});
add('hazard','eonet','NASA EONET open events','Global','open','daily','m','scrap','Wildfires, storms and volcanoes currently open.',{
  u:function(){return 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7&limit=10'},docs:'https://eonet.gsfc.nasa.gov/docs/v3',note:'Global scale.'});
add('hazard','firms','NASA FIRMS active fires','Global','key','hourly','m','scrap','Satellite fire detections.',{docs:'https://firms.modaps.eosdis.nasa.gov/api',note:'Free map key. Rare in Surrey.'});
add('hazard','meteoalarm','Meteoalarm (Europe)','Europe','open','live','m','maybe','National weather warnings across Europe as Atom feeds.',{
  u:function(){return 'https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-united-kingdom'},docs:'https://meteoalarm.org',note:'Feed path from memory. Overlaps Met Office warnings.'});

/* sky */
add('sky','suncalc','Sun and moon, computed locally','Global','open','static','m','keep','Sunrise, sunset, golden hour and moon phase with no network call.',{
  docs:'https://github.com/mourner/suncalc',note:'Open-Meteo also returns sunrise, sunset and UV in its daily block.'});
add('sky','swpc-kp','NOAA space weather: Kp index','Global','open','hourly','m','maybe','Geomagnetic activity, which predicts aurora chances.',{
  u:function(){return 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'},docs:'https://services.swpc.noaa.gov',note:'Aurora is rare in Surrey but a Kp tile is cheap.'});
add('sky','swpc-oval','NOAA aurora oval','Global','open','live','m','scrap','Aurora probability grid. Large file.',{
  u:function(){return 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json'},docs:'https://services.swpc.noaa.gov',note:'Several hundred KB.'});
add('sky','aurorawatch','AuroraWatch UK','UK','open','live','m','scrap','UK aurora alert level from magnetometers.',{
  u:function(){return 'http://aurorawatch-api.lancs.ac.uk/0.2/status/project/awn/sum-activity.xml'},docs:'https://aurorawatch.lancs.ac.uk',note:'The hostname did not resolve when probed, so this URL is wrong or the service has moved.'});
add('sky','iss','ISS position','Global','open','live','m','maybe','Where the space station is right now.',{
  u:function(){return 'https://api.wheretheiss.at/v1/satellites/25544'},docs:'https://wheretheiss.at/w/developer',note:'Fun, not local. A visible-pass tile would need another source.'});
add('sky','sunapi','Sunrise-Sunset.org','Global','open','daily','m','scrap','Sun times as JSON.',{
  u:function(c){return 'https://api.sunrise-sunset.org/json?lat='+c.lat+'&lng='+c.lon+'&formatted=0'},docs:'https://sunrise-sunset.org/api',note:'Redundant with the local calculation.'});

/* nature */
add('nature','inat','iNaturalist observations','Global','open','live','m','keep','Recent wildlife sightings within 3 km, with photos.',{
  u:function(c){return 'https://api.inaturalist.org/v1/observations?lat='+c.lat+'&lng='+c.lon+'&radius=3&order_by=observed_on&order=desc&per_page=8'},docs:'https://api.inaturalist.org/v1/docs/',note:'About one request a second. Locations of sensitive species are obscured.'});
add('nature','ebird','eBird recent sightings','Global','key','daily','m','maybe','Recent bird sightings and hotspots near a point.',{docs:'https://documenter.getpostman.com/view/664302/S1ENwy59',note:'Free key, non-commercial terms.'});
add('nature','gbif','GBIF occurrences','Global','open','monthly','m','scrap','Archived species records near a point.',{
  u:function(c){return 'https://api.gbif.org/v1/occurrence/search?decimalLatitude='+(c.lat-0.05).toFixed(4)+','+(+c.lat+0.05).toFixed(4)+'&decimalLongitude='+(c.lon-0.05).toFixed(4)+','+(+c.lon+0.05).toFixed(4)+'&limit=5'},docs:'https://www.gbif.org/developer/occurrence',note:'Mostly historical records; iNaturalist is fresher.'});

/* context */
add('context','bankhol','GOV.UK bank holidays','UK','open','static','m','keep','Bank holidays for England and Wales, Scotland and Northern Ireland.',{
  u:function(){return 'https://www.gov.uk/bank-holidays.json'},docs:'https://www.gov.uk/bank-holidays',note:'No key.'});
add('context','nager','Nager.Date public holidays','Global','open','static','m','maybe','Upcoming public holidays for 100+ countries.',{
  u:function(){return 'https://date.nager.at/api/v3/NextPublicHolidays/GB'},docs:'https://date.nager.at',note:'No key.'});


/* ---------- helpers ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function J(t){return JSON.parse(t)}
function when(x){if(x==null||x==='')return null;var d=x instanceof Date?x:new Date(typeof x==='number'&&x<1e11?x*1000:x);return isNaN(d)?null:d}
function ago(x){var d=when(x);if(!d)return '';var m=Math.round((Date.now()-d.getTime())/60000);if(m<1)return 'just now';if(m<90)return m+' min old';var h=Math.round(m/60);if(h<48)return h+' h old';return Math.round(h/24)+' days old'}
function clock(x){var d=when(x);return d?d.toLocaleString([],{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}
function hav(a,b,c,d){var R=6371,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)*Math.sin(y/2);return 2*R*Math.asin(Math.sqrt(h))}
function strip(h){return String(h==null?'':h).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<(?:br|\/p|\/div|\/li)[^>]*>/gi,' ').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#(\d+);/g,function(_,n){return String.fromCharCode(+n)}).replace(/\s+/g,' ').trim()}
function trunc(s,n){s=String(s==null?'':s);return s.length>n?s.slice(0,n-1)+'…':s}
function r1(x,d){return typeof x==='number'?(+x.toFixed(d==null?1:d)):x}
function tags(xml,tag){var re=new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+tag+'>','g'),o=[],m;while((m=re.exec(xml)))o.push(m[1]);return o}
function rss(t){return tags(t,'item').map(function(it){return {title:strip(tags(it,'title')[0]),date:strip(tags(it,'pubDate')[0]),desc:strip(tags(it,'description')[0])}})}
function atom(t){return tags(t,'entry').map(function(it){return {title:strip(tags(it,'title')[0]),date:strip(tags(it,'updated')[0])}})}
function fail(msg){var e=new Error(msg);e.soft=true;throw e}
var WMO={0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Freezing fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Freezing drizzle',57:'Freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Light showers',81:'Showers',82:'Heavy showers',85:'Snow showers',86:'Snow showers',95:'Thunderstorm',96:'Thunderstorm, hail',99:'Thunderstorm, hail'};

/* ---------- readable renderers ---------- */
/* Each takes (rawText, ctx) and returns {headline, rows:[[k,v]], items:[{t,x}], itemsTitle, flag}. */
var R={};
function lat0(c){return parseFloat(c.lat)} function lon0(c){return parseFloat(c.lon)}

R['om-ukmo']=function(t){var d=J(t);if(d.error)fail(d.reason);var c=d.current,h=d.hourly;
  var items=h?h.time.slice(0,6).map(function(x,i){return {t:x.slice(11),x:r1(h.temperature_2m[i])+' °C, '+h.precipitation[i]+' mm rain'}}):[];
  return {headline:r1(c.temperature_2m)+' °C, '+(WMO[c.weather_code]||'code '+c.weather_code).toLowerCase()+' (Met Office model)',rows:[['Wind',r1(c.wind_speed_10m)+' km/h'],['Rain now',c.precipitation+' mm'],['Model time',clock(c.time)]],items:items,itemsTitle:'Next hours'}};
R['om-flood']=function(t){var d=J(t);if(d.error)fail(d.reason);var q=d.daily;return {headline:'River discharge '+r1(q.river_discharge[0])+' m³/s today',rows:[['Grid cell',d.latitude.toFixed(3)+', '+d.longitude.toFixed(3)]],items:q.time.map(function(x,i){return {t:x.slice(5),x:r1(q.river_discharge[i])+' m³/s'}}),itemsTitle:'Forecast'}};
R['om-marine']=function(t){var d=J(t);if(d.error)fail(d.reason);var c=d.current;if(c.wave_height==null)fail('No wave data here. This point is inland.');return {headline:'Waves '+c.wave_height+' m, period '+c.wave_period+' s',rows:[['Sea temperature',c.sea_surface_temperature+' °C']]}};
R['om-geo']=function(t){var d=J(t);var r=d.results||[];return {headline:r.length?r[0].name+', '+(r[0].admin1||'')+', '+r[0].country:'No match',items:r.map(function(x){return {t:x.country_code,x:x.name+(x.admin1?', '+x.admin1:'')+' ('+x.latitude.toFixed(2)+', '+x.longitude.toFixed(2)+')'}}),itemsTitle:'Matches'}};
R['metno-loc']=function(t){var d=J(t),ts=d.properties.timeseries,n=ts[0],i=n.data.instant.details,n1=n.data.next_1_hours;
  return {headline:r1(i.air_temperature)+' °C, '+(n1?n1.summary.symbol_code.replace(/_/g,' '):'forecast'),rows:[['Wind',r1(i.wind_speed)+' m/s'],['Humidity',r1(i.relative_humidity)+' %'],['Rain next hour',n1?n1.details.precipitation_amount+' mm':'n/a'],['Valid',clock(n.time)],['Forecast hours',ts.length]]}};
R['rainviewer']=function(t){var d=J(t),p=d.radar.past||[],f=d.radar.nowcast||[],l=p[p.length-1];
  return {headline:p.length+' radar frames, newest '+(l?ago(l.time):'none'),rows:[['Newest frame',l?clock(l.time):'n/a'],['Past frames',p.length],['Forecast frames',f.length]],flag:f.length?'':'No forecast (nowcast) frames, so this is past radar only.'}};
R['wttr']=function(t){var d=J(t),c=d.current_condition[0],a=d.nearest_area[0];
  return {headline:c.temp_C+' °C, '+c.weatherDesc[0].value.toLowerCase()+' near '+a.areaName[0].value,rows:[['Feels like',c.FeelsLikeC+' °C'],['Humidity',c.humidity+' %'],['Wind',c.windspeedKmph+' km/h '+c.winddir16Point],['Area',a.areaName[0].value+', '+a.region[0].value]]}};
R['ea-floods']=function(t){var d=J(t),i=d.items||[];
  return i.length?{headline:i.length+' flood warning(s) or alert(s) nearby',items:i.map(function(x){return {t:x.severity||'',x:x.description||x.eaAreaName||''}})}:{headline:'No active flood warnings within 20 km',rows:[['Meaning','All clear right now']]}};
R['ea-tide']=function(t){var d=J(t),i=d.items||[];return {headline:i.length+' tide gauges in the sample',items:i.slice(0,6).map(function(x){return {t:x.stationReference,x:x.label}})}};
R['noaa-tides']=function(t){var d=J(t),r=d.data[0];return {headline:d.metadata.name+': '+r.v+' m',rows:[['Reading time (UTC)',r.t],['Station',d.metadata.id]],flag:'San Francisco example, not near you.'}};
R['ci-gen']=function(t){var d=J(t).data;return {headline:'Top source: '+d.generationmix.slice().sort(function(a,b){return b.perc-a.perc})[0].fuel,items:d.generationmix.filter(function(g){return g.perc>0}).sort(function(a,b){return b.perc-a.perc}).map(function(g){return {t:g.perc+'%',x:g.fuel}}),itemsTitle:'Share of GB generation now'}};
R['octopus']=function(t){var d=J(t),r=d.results||[];return {headline:d.count+' tariff products',items:r.slice(0,6).map(function(x){return {t:x.code,x:x.display_name}}),itemsTitle:'First few'}};
R['tfl-status']=function(t){var d=J(t),bad=d.filter(function(l){return l.lineStatuses[0].statusSeverityDescription!=='Good Service'});
  return {headline:bad.length?bad.length+' of '+d.length+' lines not running a good service':'Good service on all '+d.length+' lines',items:d.slice(0,8).map(function(l){return {t:l.lineStatuses[0].statusSeverityDescription,x:l.name}}),flag:'London only.'}};
R['tfl-stops']=function(t){var d=J(t),s=d.stopPoints||[];return s.length?{headline:s.length+' stops within 500 m',items:s.slice(0,6).map(function(x){return {t:x.distance?Math.round(x.distance)+' m':'',x:x.commonName}})}:{headline:'No TfL stops within 500 m',flag:'Outside Greater London, so TfL has nothing here.'}};
R['tfl-road']=function(t){var d=J(t);return {headline:d.length+' live disruptions on London roads',items:d.slice(0,5).map(function(x){return {t:x.severity,x:trunc(strip(x.location||x.comments),110)}}),flag:'London only.'}};
R['tfl-bike']=function(t){var d=J(t),p={};(d.additionalProperties||[]).forEach(function(x){p[x.key]=x.value});return {headline:d.commonName+': '+p.NbBikes+' bikes, '+p.NbEmptyDocks+' empty docks',rows:[['Updated',clock(p.NbBikes&&d.additionalProperties[0].modified)]],flag:'London only; a single dock sample.'}};
R['gbfs']=function(t){var rows=t.trim().split('\n'),h=rows[0].split(',');var gb=rows.slice(1).filter(function(r){return r.indexOf('GB,')===0});
  return {headline:(rows.length-1)+' bike and scooter systems worldwide, '+gb.length+' in the UK',items:gb.slice(0,8).map(function(r){var p=r.split(',');return {t:p[0],x:(p[1]||'')+' ('+(p[2]||'')+')'}}),itemsTitle:'UK systems'}};
R['mobdb']=function(t){var rows=t.split('\n'),h=rows[0].split(',');return {headline:(rows.length-1)+' public transport feeds in the catalogue',rows:[['Columns',h.length],['Size',r1(t.length/1048576)+' MB']],flag:'Large file. Fetch once and cache.'}};
R['digitraffic']=function(t){var d=J(t),f=d.features||[];return {headline:f.length+' Finnish traffic announcements',items:f.slice(0,5).map(function(x){var a=(x.properties.announcements||[])[0]||{};return {t:'',x:trunc(a.title||x.properties.situationType,110)}})}};
R['opensky']=function(t,c){var d=J(t),s=d.states||[];var air=s.filter(function(x){return !x[8]});
  var list=air.map(function(x){return {cs:(x[1]||'').trim()||'(no callsign)',alt:x[13]||x[7],v:x[9],km:hav(lat0(c),lon0(c),x[6],x[5]),oc:x[2]}}).sort(function(a,b){return a.km-b.km});
  return {headline:air.length+' aircraft in the air nearby ('+(s.length-air.length)+' on the ground)',rows:[['Data time',clock(d.time)+' ('+ago(d.time)+')']],items:list.slice(0,6).map(function(a){return {t:a.km.toFixed(0)+' km',x:a.cs+' · '+a.oc+' · '+(a.alt!=null?Math.round(a.alt)+' m':'alt n/a')+' · '+(a.v!=null?Math.round(a.v*3.6)+' km/h':'')}}),itemsTitle:'Closest first'}};
R['adsblol']=function(t,c){var d=J(t),a=d.ac||[];var air=a.filter(function(x){return x.alt_baro!=='ground'});
  return {headline:air.length+' aircraft in the air within 25 nm ('+(a.length-air.length)+' on the ground)',items:air.sort(function(x,y){return (x.dst||0)-(y.dst||0)}).slice(0,6).map(function(x){return {t:x.dst!=null?r1(x.dst,0)+' nm':'',x:(x.flight||x.r||x.hex).trim()+' · '+(x.t||'')+' · '+(x.alt_baro!=null?x.alt_baro+' ft':'')+(x.type==='mlat'?' · MLAT':'')}}),itemsTitle:'Closest first'}};
R['airplanes']=R['adsblol'];
R['nominatim']=function(t){var d=J(t),a=d.address||{};return {headline:trunc(d.display_name,90),rows:[['Road',a.road||''],['Area',a.suburb||a.village||a.town||a.city||''],['Postcode',a.postcode||''],['County',a.county||'']]}};
R['postcodes']=function(t){var d=J(t),r=d.result;if(!r||!r.length)return {headline:'No postcode within 500 m',flag:'The default 100 m radius often finds nothing. This call uses 500 m.'};var x=r[0];
  return {headline:x.postcode+' · '+x.admin_ward+', '+x.admin_district,rows:[['Council',x.admin_district],['Ward',x.admin_ward],['LSOA',x.lsoa],['Constituency',x.parliamentary_constituency],['Region',x.region]],items:r.slice(1).map(function(y){return {t:'',x:y.postcode}}),itemsTitle:'Other nearby postcodes'}};
R['postcodes-out']=function(t){var d=J(t),r=d.result;return {headline:r.outcode+' covers '+(r.admin_district||[]).join(', '),rows:[['Parishes',(r.parish||[]).slice(0,4).join(', ')],['Centre',r.latitude+', '+r.longitude]]}};
R['ipwho']=function(t){var d=J(t);return {headline:d.city+', '+d.region+', '+d.country,rows:[['Timezone',d.timezone&&d.timezone.id],['Connection',d.connection&&d.connection.isp]],flag:'This is where the internet thinks you are, from your IP address. Compare it with your real location to judge how good it is.'}};
R['osmnotes']=function(t){var d=J(t),f=d.features||[];return {headline:f.length+' map notes nearby, newest '+(f[0]?ago(f[0].properties.date_created.replace(' UTC','').replace(' ','T')+'Z'):'n/a'),items:f.slice(0,6).map(function(x){var c=x.properties.comments[0]||{};return {t:(x.properties.date_created||'').slice(0,10),x:trunc(strip(c.text),100)||'(no text)'}}),itemsTitle:'Notes'}};
R['planning']=function(t){var d=J(t);return d.count?{headline:d.count+' planning constraints here',items:d.entities.slice(0,5).map(function(x){return {t:x.dataset,x:x.name||x.reference||''}})}:{headline:'No conservation area at this exact point',flag:'An empty answer is normal when the point is not inside one.'}};
R['police-nh']=function(t){var d=J(t);return {headline:'Neighbourhood '+d.neighbourhood+', '+d.force.replace(/-/g,' ')}};
R['nyc311']=function(t){var d=J(t);return {headline:d.length+' latest New York 311 requests',items:d.slice(0,5).map(function(x){return {t:clock(x.created_date),x:x.complaint_type+' · '+(x.borough||'')}}),flag:'New York example, not near you.'}};
R['gdelt-doc']=function(t){var d=J(t),a=d.articles||[];return {headline:a.length+' news articles mentioning the place name',items:a.slice(0,8).map(function(x){return {t:x.sourcecountry,x:trunc(x.title,100)+' ('+x.domain+')'}}),itemsTitle:'Judge relevance yourself',flag:'Matches the place name as text, so expect national stories and namesakes.'}};
function feed(t){return rss(t)}
R['bbc-berks']=R['bbc-surrey']=function(t){var i=rss(t);return {headline:i.length+' stories, newest '+(i[0]?ago(i[0].date):'n/a'),items:i.slice(0,8).map(function(x){return {t:clock(x.date),x:trunc(x.title,100)}}),itemsTitle:'Latest first'}};
R['masto-tag']=function(t){var d=J(t);return {headline:d.length+' recent public posts under the tag, newest '+(d[0]?ago(d[0].created_at):'n/a'),items:d.slice(0,8).map(function(p){return {t:clock(p.created_at),x:'@'+p.account.acct+': '+trunc(strip(p.content),130)}}),itemsTitle:'Latest first',flag:'Check whether these are about your Windsor or another one.'}};
R['bsky-app']=R['bsky-pub']=function(t){var d=J(t),p=d.posts||[];return {headline:p.length+' recent posts matching the place name, newest '+(p[0]?ago(p[0].record.createdAt):'n/a'),items:p.slice(0,8).map(function(x){return {t:clock(x.record.createdAt),x:'@'+x.author.handle+': '+trunc(strip(x.record.text),130)}}),itemsTitle:'Latest first',flag:'Keyword matches, no location. Judge how many are really about your place.'}};
R['usgs-eq']=function(t){var f=J(t).features;return f.length?{headline:f.length+' recent earthquakes within 1,000 km',items:f.map(function(x){return {t:clock(x.properties.time),x:'M'+x.properties.mag+' · '+x.properties.place}})}:{headline:'No earthquakes within 1,000 km',flag:'Normal for southern England.'}};
R['gdacs']=function(t){var f=J(t).features||[];return {headline:f.length+' global disaster alerts',items:f.slice(0,6).map(function(x){var p=x.properties;return {t:p.alertlevel,x:trunc(p.name||p.eventtype,100)}}),flag:'Global scale, rarely local.'}};
R['eonet']=function(t){var e=J(t).events||[];return {headline:e.length+' open natural events worldwide',items:e.slice(0,6).map(function(x){return {t:x.categories[0].title,x:trunc(x.title,90)}})}};
R['meteoalarm']=function(t){var e=atom(t);return {headline:e.length+' UK warning entries in the feed',items:e.slice(0,6).map(function(x){return {t:clock(x.date),x:trunc(x.title,100)}}),flag:'No CORS header expected, so a browser may block it.'}};
R['swpc-oval']=function(t){var d=J(t);return {headline:'Aurora forecast grid, '+(d.coordinates||[]).length+' points',rows:[['Observation time',d['Observation Time']],['Forecast time',d['Forecast Time']]],flag:'Large file; needs processing to be useful.'}};
R['iss']=function(t){var d=J(t);return {headline:'ISS over '+r1(d.latitude,1)+', '+r1(d.longitude,1),rows:[['Altitude',r1(d.altitude,0)+' km'],['Speed',r1(d.velocity,0)+' km/h'],['Visibility',d.visibility],['Updated',ago(d.timestamp)]]}};
R['gbif']=function(t){var d=J(t);return {headline:d.count+' archived species records nearby',items:d.results.slice(0,6).map(function(o){return {t:(o.eventDate||'').slice(0,10),x:o.species||o.scientificName}})}};
R['nager']=function(t){var d=J(t);return {headline:'Next: '+d[0].localName+', '+d[0].date,items:d.slice(0,4).map(function(x){return {t:x.date,x:x.localName}})}};
R['ukair-sos']=function(t){var d=J(t);return {headline:'Returned '+d.length+' stations from the national list',items:d.slice(0,5).map(function(x){return {t:'',x:x.properties.label}}),flag:'No distance filter in this call; you would filter by location yourself.'}};
R['usgs-water']=function(t){var d=J(t),s=(d.value&&d.value.timeSeries)||[];return {headline:s.length+' US river gauges in the box',items:s.slice(0,5).map(function(x){return {t:'',x:x.sourceInfo.siteName}}),flag:'US only.'}};
R['overpass']=function(t){var d=J(t),e=d.elements||[];return {headline:e.length+' mapped places within 400 m',items:e.slice(0,10).map(function(x){var g=x.tags||{};return {t:g.amenity||'',x:g.name||'(unnamed)'+(g.opening_hours?' · '+g.opening_hours:'')}}),itemsTitle:'Nearby amenities'}};

/* Multi-step renderers: fetch stations, then each nearest gauge's latest reading. */
function nearestStations(d,c,n){return (d.items||[]).map(function(s){return {ref:s.stationReference,label:s.label,river:s.riverName,km:hav(lat0(c),lon0(c),s.lat,s.long)}}).sort(function(a,b){return a.km-b.km}).slice(0,n)}
var RUN={};
/* ---------- context: what the numbers mean ---------- */
/* A preview may carry level:{k,label,text}. k is good | ok | warn | bad | info.
   A row may carry a third item (a plain-language note) and a fourth (a level key for that note). */
var BAND_WORDS=['Good','Fair','Moderate','Poor','Very poor','Extremely poor'];
var CUTS={pm2_5:[5,15,50,90,140],pm10:[15,45,120,195,270],nitrogen_dioxide:[10,25,60,100,150],ozone:[60,100,120,160,180]};  /* European Air Quality Index bands, µg/m³ */
var WHO={pm2_5:15,pm10:45,nitrogen_dioxide:25,ozone:100};  /* WHO 2021 short-term guidelines, µg/m³ */
var POL_NAME={pm2_5:'PM2.5',pm10:'PM10',nitrogen_dioxide:'Nitrogen dioxide',ozone:'Ozone'};
var AQI_TEXT=['Clean air. Nothing to worry about.','Fine for nearly everyone.','People with asthma or heart conditions may notice it. Everyone else is fine.','Sensitive people should take it easier outdoors.','Everyone should cut back on hard exercise outside.','Avoid strenuous activity outdoors.'];
function bandOf(p,v){var c=CUTS[p],i=0;while(i<c.length&&v>=c[i])i++;return i}
function lk(i){return i<=0?'good':i===1?'ok':i===2?'warn':'bad'}
function aqiIdx(a){return a<20?0:a<40?1:a<60?2:a<80?3:a<100?4:5}
function pollRow(p,v){var i=bandOf(p,v);return [POL_NAME[p],v+' µg/m³',BAND_WORDS[i]+' · '+Math.round(100*v/WHO[p])+'% of the WHO guideline ('+WHO[p]+')',lk(i)]}
function uvInfo(u){return u<3?['Low','No protection needed.','good']:u<6?['Moderate','Sunscreen if you will be out for long.','ok']:u<8?['High','Cover up and seek shade around midday.','warn']:u<11?['Very high','Avoid the midday sun and cover up.','bad']:['Extreme','Stay out of the midday sun.','bad']}
function pollenInfo(v){return v==null?['No data','Out of season, or not covered here.']:v<30?['Low','Unlikely to bother most people.','good']:v<50?['Moderate','Hay fever sufferers may notice symptoms.','ok']:v<150?['High','Hay fever symptoms are likely.','warn']:['Very high','Severe hay fever symptoms are likely.','bad']}
function beaufort(k){var s=[[1,'calm'],[6,'light air'],[12,'light breeze'],[20,'gentle breeze'],[29,'moderate breeze'],[39,'fresh breeze'],[50,'strong breeze'],[62,'near gale'],[75,'gale'],[89,'strong gale'],[103,'storm'],[1e9,'violent storm']];for(var i=0;i<s.length;i++)if(k<s[i][0])return s[i][1]}
function median(a){a=a.slice().sort(function(x,y){return x-y});var m=a.length>>1;return a.length?(a.length%2?a[m]:(a[m-1]+a[m])/2):null}
function dayLen(lat,date){var N=Math.floor((Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())-Date.UTC(date.getUTCFullYear(),0,0))/864e5),dec=0.4093*Math.sin(2*Math.PI*(284+N)/365),phi=lat*Math.PI/180,x=Math.max(-1,Math.min(1,-Math.tan(phi)*Math.tan(dec)));return 24/Math.PI*Math.acos(x)*60}
function hm(m){return Math.floor(m/60)+' h '+Math.round(m%60)+' min'}

/* weather: temperature in seasonal context, wind in words */
var CLIM={};
function climate(c,get){var k=(+c.lat).toFixed(1)+','+(+c.lon).toFixed(1);
  if(!CLIM[k]){var y=new Date().getUTCFullYear();
    CLIM[k]=get('https://archive-api.open-meteo.com/v1/archive?latitude='+c.lat+'&longitude='+c.lon+'&start_date='+(y-10)+'-01-01&end_date='+(y-1)+'-12-31&daily=temperature_2m_mean&timezone=GMT')
      .then(function(r){return J(r.text).daily},function(e){delete CLIM[k];throw e})}
  return CLIM[k]}
function normalFor(daily,date){var ref=Date.UTC(2001,date.getUTCMonth(),date.getUTCDate()),sum=0,n=0;
  daily.time.forEach(function(s,i){var v=daily.temperature_2m_mean[i];if(v==null)return;var p=s.split('-'),diff=Math.abs(Date.UTC(2001,+p[1]-1,+p[2])-ref)/864e5;diff=Math.min(diff,365-diff);if(diff<=7){sum+=v;n++}});
  return n?{mean:sum/n,n:n}:null}
R['om-forecast']=function(t){var d=J(t);if(d.error)fail(d.reason);var c=d.current,u=d.current_units||{},dy=d.daily,rows=[];
  var diff=c.apparent_temperature-c.temperature_2m;
  rows.push(['Feels like',r1(c.apparent_temperature)+' °C',Math.abs(diff)>=2?(diff<0?'Wind chill makes it feel '+r1(-diff,0)+' °C colder.':'It feels '+r1(diff,0)+' °C warmer than the air temperature.'):undefined]);
  rows.push(['Wind',r1(c.wind_speed_10m)+' km/h',beaufort(c.wind_speed_10m)+(c.wind_gusts_10m?', gusts to '+r1(c.wind_gusts_10m,0)+' km/h':'')]);
  rows.push(['Rain right now',c.precipitation+' mm',c.precipitation===0?'Dry.':c.precipitation<0.5?'Light.':c.precipitation<2?'Moderate.':'Heavy.']);
  if(dy&&dy.temperature_2m_max)rows.push(['Today',r1(dy.temperature_2m_min[0],0)+' to '+r1(dy.temperature_2m_max[0],0)+' °C']);
  var m=d.minutely_15,items=m?m.time.slice(0,8).map(function(x,i){return {t:x.slice(11),x:m.precipitation[i]+' mm'}}):[];
  var wet=m?m.precipitation.slice(0,8).some(function(x){return x>0}):false;
  return {headline:r1(c.temperature_2m)+' °C, '+(WMO[c.weather_code]||'code '+c.weather_code).toLowerCase(),
    level:m?{k:wet?'info':'good',label:wet?'Rain likely':'Dry',text:wet?'Rain is expected within the next two hours.':'No rain expected in the next two hours.'}:undefined,
    rows:rows,items:items,itemsTitle:'Next two hours of rain',_mean:dy&&dy.temperature_2m_max?(dy.temperature_2m_max[0]+dy.temperature_2m_min[0])/2:null}};
RUN['om-forecast']=function(c,get,first){var pv=R['om-forecast'](first.text,c);
  if(pv._mean==null)return pv;
  return climate(c,get).then(function(daily){var nm=normalFor(daily,new Date());if(!nm)return pv;
    var diff=pv._mean-nm.mean,a=Math.abs(diff),word=a<1?'about normal':(a<3?'a little ':a<6?'noticeably ':'much ')+(diff>0?'warmer':'colder');
    pv.rows.unshift(['Compared with normal',word,'Today averages about '+r1(pv._mean,0)+' °C; the usual for this time of year is '+r1(nm.mean,0)+' °C (average of the last 10 years).',a>=6?'warn':undefined]);
    pv.headline+=' · '+word+' for the season';return pv},function(){return pv})};
R['om-aq']=function(t){var d=J(t);if(d.error)fail(d.reason);var c=d.current,i=aqiIdx(c.european_aqi),rows=[];
  ['pm2_5','pm10','nitrogen_dioxide','ozone'].forEach(function(p){if(c[p]!=null)rows.push(pollRow(p,c[p]))});
  if(c.uv_index!=null){var u=uvInfo(c.uv_index);rows.push(['UV index',c.uv_index,u[0]+'. '+u[1],u[2]])}
  var h=d.hourly;if(h)[['alder_pollen','Alder pollen'],['birch_pollen','Birch pollen'],['grass_pollen','Grass pollen']].forEach(function(k){var v=(h[k[0]]||[]).filter(function(x){return x!=null}),m=v.length?Math.max.apply(null,v):null,p=pollenInfo(m);rows.push([k[1],m==null?'no data':m+' grains/m³',p[0]+'. '+p[1],p[2]])});
  return {headline:'Air quality: '+BAND_WORDS[i].toLowerCase(),level:{k:lk(i),label:BAND_WORDS[i],text:AQI_TEXT[i]},rows:rows,flag:'A model on an 11 km grid, not a measurement at your street. Bands follow the European Air Quality Index; percentages are against the WHO guideline.'}};
R['sensorcomm']=function(t,c){var d=J(t),by={};
  d.forEach(function(r){var id=r.sensor.id,o=by[id]||(by[id]={lat:+r.location.latitude,lon:+r.location.longitude,v:{},ts:r.timestamp});r.sensordatavalues.forEach(function(x){o.v[x.value_type]=parseFloat(x.value)});o.ts=r.timestamp});
  var list=Object.keys(by).map(function(k){var o=by[k];o.km=hav(lat0(c),lon0(c),o.lat,o.lon);return o}).sort(function(a,b){return a.km-b.km});
  var odd=0,pm=list.filter(function(o){return o.v.P2!=null&&o.v.P2>=0&&o.v.P2<1000}).map(function(o){return o.v.P2});
  var items=list.slice(0,8).map(function(o){var b=[];if(o.v.P2!=null)b.push('PM2.5 '+o.v.P2+' ('+BAND_WORDS[bandOf('pm2_5',o.v.P2)].toLowerCase()+')');if(o.v.temperature!=null)b.push(o.v.temperature+' °C');if(o.v.humidity!=null)b.push(o.v.humidity+'% humidity');
    if(o.v.pressure!=null){var hpa=o.v.pressure/100;if(hpa<850||hpa>1100){b.push('pressure reads '+r1(hpa,0)+' hPa (faulty)');odd++}}
    return {t:o.km.toFixed(1)+' km',x:b.join(' · ')+' · '+ago(o.ts.replace(' ','T')+'Z')}});
  var md=median(pm),bi=md==null?null:bandOf('pm2_5',md);
  return {headline:list.length?(md!=null?'Typical PM2.5 nearby: '+r1(md)+' µg/m³ ('+BAND_WORDS[bi].toLowerCase()+')':list.length+' sensors, none reporting dust'):'No sensors within 15 km',
    level:md!=null?{k:lk(bi),label:BAND_WORDS[bi],text:'About '+Math.round(100*md/WHO.pm2_5)+'% of the WHO daily guideline of '+WHO.pm2_5+' µg/m³, from the median of '+pm.length+' citizen sensors.'}:undefined,
    rows:list.length?[['Sensors within 15 km',list.length],['Nearest',list[0].km.toFixed(1)+' km away']]:[],items:items,itemsTitle:'Nearest first',flag:odd?odd+' sensor(s) report impossible pressure, so some are faulty. These need filtering out.':''}};

/* water: where the river sits against its own history */
function levelPos(val,sc){var lo=sc.typicalRangeLow,hi=sc.typicalRangeHigh,hr=sc.highestRecent;if(lo==null||hi==null)return null;
  var mx=hr&&hr.value;
  if(val<lo)return {k:'info',label:'Lower than usual',text:'Below its normal range of '+lo+' to '+hi+' m.'};
  if(val<=hi)return {k:'good',label:'Normal',text:'Within its usual range of '+lo+' to '+hi+' m.'};
  if(mx>hi&&(val-hi)/(mx-hi)>=0.75)return {k:'bad',label:'Very high',text:'Close to the highest level recorded recently ('+mx+' m).'};
  return {k:'warn',label:'Higher than usual',text:'Above its normal range of '+lo+' to '+hi+' m'+(mx?'. The highest recent level was '+mx+' m'+(hr.dateTime?' in '+new Date(hr.dateTime).getFullYear():'')+'.':'.')}}
function readingsFor(s,get){return get('https://environment.data.gov.uk/flood-monitoring/id/stations/'+s.ref+'/readings?latest').then(function(r){return {s:s,items:J(r.text).items||[]}},function(){return {s:s,items:[]}})}
function levelOf(items){var x=items.filter(function(r){return /level-stage/.test(r.measure||'')&&!/downstage/.test(r.measure||'')})[0];return x?x.value:null}
function flowOf(items){var x=items.filter(function(r){return /flow/.test(r.measure||'')})[0];return x?x.value:null}
RUN['ea-levels']=function(c,get,first){var d=J(first.text),near=nearestStations(d,c,5);
  return Promise.all(near.map(function(s){return readingsFor(s,get)})).then(function(res){
    var cand=res.filter(function(x){return levelOf(x.items)!=null}).slice(0,2);
    return Promise.all(cand.map(function(x){return get('https://environment.data.gov.uk/flood-monitoring/id/stations/'+x.s.ref+'/stageScale').then(function(r){x.sc=J(r.text).items},function(){})})).then(function(){
      var top=cand.filter(function(x){return x.sc&&x.sc.typicalRangeHigh!=null})[0]||cand[0]||res[0],lv=top&&levelOf(top.items),fl=top&&flowOf(top.items),t0=top.items[0]&&top.items[0].dateTime;
      var pos=top.sc&&lv!=null?levelPos(lv,top.sc):null;
      var lm=top.items.filter(function(r){return /level-stage/.test(r.measure||'')&&!/downstage/.test(r.measure||'')})[0];
      return {_m:lm&&lm.measure,_sc:top.sc,headline:top.s.label+' on the '+(top.s.river||'river')+': '+(lv!=null?lv+' m':'no level reading')+(pos?' · '+pos.label.toLowerCase():''),level:pos||undefined,
        rows:[['Water level',lv!=null?lv+' m (above the gauge datum)':'n/a',pos?pos.text:undefined],fl!=null?['Flow',fl+' m³/s']:null,['Reading time',t0?clock(t0)+' ('+ago(t0)+')':'n/a'],['Gauges within 10 km',(d.items||[]).length]].filter(Boolean),
        items:res.map(function(x){var l=levelOf(x.items);return {t:x.s.km.toFixed(1)+' km',x:x.s.label+': '+(l!=null?l+' m':'no level')+(flowOf(x.items)!=null?' · flow '+flowOf(x.items)+' m³/s':'')}}),itemsTitle:'Nearest gauges',
        flag:'Readings are every 15 minutes, but some sites upload only a few times a day.'}})})};
function rainWords(mm15){var h=mm15*4;return h===0?['Dry','No rain at this gauge.','good']:h<2.5?['Light rain','Under 2.5 mm an hour.','ok']:h<7.6?['Moderate rain','Between 2.5 and 7.6 mm an hour.','warn']:['Heavy rain','More than 7.6 mm an hour.','bad']}
RUN['ea-rain']=function(c,get,first){var d=J(first.text),near=nearestStations(d,c,3);
  return Promise.all(near.map(function(s){return readingsFor(s,get)})).then(function(res){
    var vals=res.map(function(x){return x.items[0]?x.items[0].value:null}),have=vals.filter(function(v){return v!=null}),mx=have.length?Math.max.apply(null,have):null,w=mx==null?null:rainWords(mx),r0=res[0].items[0];
    return {_m:r0&&r0.measure,headline:w?w[0]+' at the nearest gauges':'No reading at the nearest gauges',level:w?{k:w[2],label:w[0],text:w[1]+' Highest of '+have.length+' gauges: '+mx+' mm in the last 15 minutes.'}:undefined,
      rows:[['Reading time',r0?clock(r0.dateTime)+' ('+ago(r0.dateTime)+')':'n/a'],['Gauges within 15 km',(d.items||[]).length]],
      items:res.map(function(x){var q=x.items[0];return {t:x.s.km.toFixed(1)+' km',x:q?q.value+' mm in 15 min':'no reading'}}),itemsTitle:'Nearest gauges',flag:'Gauge names are all just “Rainfall station”; positions are snapped to a grid.'}})};

/* energy: now against the next 24 hours */
var CI_LVL={'very low':'good',low:'good',moderate:'ok',high:'warn','very high':'bad'};
var CI_TEXT={'very low':'Very clean: mostly wind, solar and nuclear.',low:'Clean: low-carbon sources are doing most of the work.',moderate:'Middling: a fair share of gas on the grid.',high:'Dirty: gas and imports are doing a lot of the work.','very high':'Very dirty: avoid heavy use if you can.'};
function ciBase(x,region){var i=x.intensity,v=i.actual!=null?i.actual:i.forecast;
  return {_v:v,_mix:(x.generationmix||[]).filter(function(g){return g.perc>0}).sort(function(a,b){return b.perc-a.perc}).slice(0,6),headline:v+' gCO₂/kWh, '+i.index+(region?' ('+region+')':''),level:{k:CI_LVL[i.index]||'info',label:i.index.charAt(0).toUpperCase()+i.index.slice(1),text:CI_TEXT[i.index]||''},rows:[['Half hour',clock(x.from)+' to '+clock(x.to).split(', ').pop()]],
    items:(x.generationmix||[]).filter(function(g){return g.perc>0}).sort(function(a,b){return b.perc-a.perc}).slice(0,5).map(function(g){return {t:g.perc+'%',x:g.fuel}}),itemsTitle:'Where the power comes from'}}
function ciAhead(pv,arr){if(!arr.length)return pv;pv._ci=arr;var mn=arr[0],mx=arr[0],sum=0;arr.forEach(function(a){if(a.v<mn.v)mn=a;if(a.v>mx.v)mx=a;sum+=a.v});var avg=sum/arr.length;
  function wd(t){return new Date(t).toLocaleString([],{weekday:'short',hour:'2-digit',minute:'2-digit'})}
  pv.rows.push(['Cleanest time ahead',mn.v+' gCO₂/kWh at '+wd(mn.t),'A good time to run the washing machine or charge a car.','good']);
  pv.rows.push(['Dirtiest time ahead',mx.v+' gCO₂/kWh at '+wd(mx.t),'Best to avoid heavy use then.','warn']);
  pv.rows.push(['Now against the next 24 h',pv._v<=avg?Math.round(100*(avg-pv._v)/avg)+'% cleaner than the average':Math.round(100*(pv._v-avg)/avg)+'% dirtier than the average','Average of the forecast: '+Math.round(avg)+' gCO₂/kWh.']);
  var step=arr.filter(function(a,i){return i%6===0}).slice(0,8);pv.items=step.map(function(a){return {t:new Date(a.t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),x:a.v+' gCO₂/kWh, '+a.i}});pv.itemsTitle='Next 24 hours';return pv}
function nowIso(){return new Date().toISOString().slice(0,16)+'Z'}
R['ci-nat']=function(t){return ciBase(J(t).data[0])};
R['ci-reg']=function(t){var d=J(t).data[0],pv=ciBase(d.data[0],d.shortname);pv.rows.unshift(['Region',d.dnoregion]);pv.flag='A regional forecast, not a measurement at your postcode.';return pv};
RUN['ci-nat']=function(c,get,first){var pv=R['ci-nat'](first.text);return get('https://api.carbonintensity.org.uk/intensity/'+nowIso()+'/fw24h').then(function(r){return ciAhead(pv,J(r.text).data.map(function(x){return {t:x.from,v:x.intensity.forecast,i:x.intensity.index}}))},function(){return pv})};
RUN['ci-reg']=function(c,get,first){var pv=R['ci-reg'](first.text);return get('https://api.carbonintensity.org.uk/regional/intensity/'+nowIso()+'/fw24h/postcode/'+enc(c.pc)).then(function(r){return ciAhead(pv,J(r.text).data.data.map(function(x){return {t:x.from,v:x.intensity.forecast,i:x.intensity.index}}))},function(){return pv})};
R['elexon']=function(t){var d=J(t),a=d.data||d,l=a[a.length-1],tot=l.data.reduce(function(s,x){return s+x.generation},0),LOW={WIND:1,SOLAR:1,NUCLEAR:1,NPSHYD:1,BIOMASS:1},low=l.data.reduce(function(s,x){return s+(LOW[x.fuelType]?x.generation:0)},0),pc=Math.round(100*low/tot);
  return {headline:r1(tot/1000,1)+' GW generating, '+pc+'% low-carbon',level:{k:pc>=60?'good':pc>=40?'ok':'warn',label:pc>=60?'Clean':pc>=40?'Mixed':'Gas-heavy',text:pc+'% from wind, solar, nuclear, hydro and biomass; the rest is mainly gas and imports.'},rows:[['Settlement period',l.settlementPeriod+' at '+clock(l.startTime)]],items:l.data.filter(function(x){return x.generation>0}).sort(function(a,b){return b.generation-a.generation}).slice(0,6).map(function(x){return {t:r1(x.generation/1000,1)+' GW',x:x.fuelType}}),itemsTitle:'By fuel'}};

/* sky and calendar */
R['swpc-kp']=function(t){var d=J(t).filter(function(r){return Array.isArray(r)?r[0]!=='time_tag':true}).map(function(r){return Array.isArray(r)?{time:r[0],kp:r[1]}:{time:r.time_tag,kp:r.Kp!=null?r.Kp:r.kp_index}}),l=d[d.length-1],k=+l.kp;
  var lv=k<4?{k:'info',label:'Quiet',text:'No aurora expected in the UK.'}:k<6?{k:'ok',label:'Active',text:'Aurora possible in northern Scotland, but not in southern England.'}:k<7?{k:'warn',label:'Storm',text:'Aurora may be visible from northern England on a clear night.'}:{k:'good',label:'Strong storm',text:'Aurora could be visible from southern England on a clear dark night.'};
  return {headline:'Kp index '+l.kp+' ('+lv.label.toLowerCase()+')',level:lv,rows:[['Measured',String(l.time).slice(11,16)+' UTC'],['Scale','0 is quiet; 5 and above is a geomagnetic storm']],items:d.slice(-5).map(function(r){return {t:String(r.time).slice(11,16),x:'Kp '+r.kp}})}};
R['sunapi']=function(t,c){var r=J(t).results,now=new Date(),la=lat0(c),today=dayLen(la,now),tom=dayLen(la,new Date(now.getTime()+864e5)),ch=tom-today,yr=now.getUTCFullYear();
  var sh=dayLen(la,new Date(Date.UTC(yr,11,21))),lo=dayLen(la,new Date(Date.UTC(yr,5,21)));
  var word=Math.abs(ch)<0.5?'about the same length tomorrow':(ch>0?'lengthening':'shortening')+' by about '+r1(Math.abs(ch),1)+' min a day';
  return {headline:'Sunrise '+clock(r.sunrise).split(', ').pop()+', sunset '+clock(r.sunset).split(', ').pop(),level:{k:'info',label:ch>0?'Days lengthening':'Days shortening',text:'Daylight is '+word+'. The shortest day is about '+hm(sh)+', the longest about '+hm(lo)+'.'},rows:[['Daylight today',hm(r.day_length/60)]]}};
R['bankhol']=function(t){var e=J(t)['england-and-wales'].events.filter(function(x){return x.date>=new Date().toISOString().slice(0,10)});
  function inDays(s){var n=Math.round((new Date(s+'T00:00:00Z')-new Date(new Date().toISOString().slice(0,10)+'T00:00:00Z'))/864e5);return n===0?'today':n===1?'tomorrow':'in '+n+' days'}
  return {headline:e[0]?'Next: '+e[0].title+', '+inDays(e[0].date):'No upcoming holidays listed',items:e.slice(0,4).map(function(x){return {t:inDays(x.date),x:x.title+' ('+x.date+')'+(x.notes?' · '+x.notes:'')}})}};

/* local civic data: rates and distributions */
R['fixmystreet']=function(t){var i=rss(t),ds=i.map(function(x){return when(x.date)}).filter(Boolean),span=ds.length>1?(ds[0]-ds[ds.length-1])/864e5:0,rate=span>0.05?i.length/span:null;
  return {headline:i.length+' recent reports nearby, newest '+(i[0]?ago(i[0].date):'n/a'),level:rate!=null?{k:'info',label:rate>=5?'Busy':rate>=1?'Active':'Quiet',text:'About '+r1(rate,rate<10?1:0)+' reports a day in this area, based on the latest '+i.length+' reports over '+r1(span,1)+' days.'}:undefined,items:i.slice(0,8).map(function(x){return {t:clock(x.date),x:trunc(x.title,90)}}),itemsTitle:'Latest first'}};
R['fsa']=function(t){var d=J(t),e=d.establishments||[],n=function(s){return String(s||'').replace(/\\&/g,'&')},by={};
  e.forEach(function(x){by[x.RatingValue]=(by[x.RatingValue]||0)+1});
  var MEAN={'5':'very good','4':'good','3':'generally satisfactory','2':'improvement necessary','1':'major improvement necessary','0':'urgent improvement necessary',Exempt:'exempt from rating (for example low-risk or temporary)',AwaitingInspection:'not inspected yet'};
  var nums=Object.keys(by).filter(function(k){return /^\d$/.test(k)}).sort(function(a,b){return b-a}),others=Object.keys(by).filter(function(k){return !/^\d$/.test(k)}),rated=nums.reduce(function(s,k){return s+by[k]},0),top=by['5']||0,low=['0','1','2'].reduce(function(s,k){return s+(by[k]||0)},0);
  return {headline:e.length+' food businesses within a mile'+(rated?'. '+top+' of '+rated+' rated ones have the top score of 5':''),
    level:rated?{k:low?'warn':top/rated>=0.7?'good':'ok',label:low?'Some need improving':top/rated>=0.7?'Mostly very good':'Mixed',text:low?low+' rated 2 or below, which means improvement is needed.':'Ratings run from 0 (urgent improvement) to 5 (very good).'}:undefined,
    rows:nums.concat(others).map(function(k){return [/^\d$/.test(k)?'Rated '+k:k.replace(/([a-z])([A-Z])/g,'$1 $2'),by[k]+(by[k]>1?' businesses':' business'),MEAN[k]||'']}),
    items:e.slice(0,8).map(function(x){return {t:/^\d$/.test(x.RatingValue)?'rated '+x.RatingValue:String(x.RatingValue).replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase(),x:n(x.BusinessName)+' ('+x.BusinessType+', '+(x.Distance*1609|0)+' m)'}}),itemsTitle:'Nearest first'}};
R['police']=function(t){var d=J(t),by={};d.forEach(function(c){by[c.category]=(by[c.category]||0)+1});var m=d[0]&&d[0].month,keys=Object.keys(by).sort(function(a,b){return by[b]-by[a]}),days=30;
  return {headline:d.length+' crimes reported within a mile in '+m,level:{k:'info',label:'About '+r1(d.length/days,1)+' a day',text:'The most common type was '+(keys[0]||'none').replace(/-/g,' ')+' ('+(by[keys[0]]||0)+'). This is a count, not a rate, so compare it with another area before reading anything into it.'},rows:[['Month covered',m],['Freshness','About 2 months behind']],items:keys.slice(0,6).map(function(k){return {t:by[k],x:k.replace(/-/g,' ')}}),itemsTitle:'By category',flag:'Monthly data with locations deliberately blurred. Not live.'}};


/* ---------- charts and pictures ---------- */
/* A preview may carry viz:[...], cards:[...], images:[...]. Specs are plain data; these functions draw them as HTML/SVG. */
var KCLASS={good:'good',ok:'ok',warn:'warn',bad:'bad',info:'info'};
function nf(x,d){if(x==null||isNaN(x))return '';var a=Math.abs(x);return String(+(+x).toFixed(d!=null?d:(a>=100?0:a>=10?1:2)))}
function safeUrl(u){return typeof u==='string'&&/^https:\/\//.test(u)?u:''}
function vBars(v){var mx=v.max||Math.max.apply(null,v.data.map(function(d){return d.value}).concat(v.ref?[v.ref.value]:[]))||1,h='<figure class="viz"><figcaption>'+esc(v.title)+'</figcaption><div class="bars">';
  v.data.forEach(function(d){h+='<div class="br"><span class="bl">'+esc(d.label)+'</span><span class="bt"><i class="vk-'+(KCLASS[d.k]||'accent')+'" style="width:'+Math.max(1,Math.min(100,100*d.value/mx)).toFixed(1)+'%"></i>'+(v.ref?'<u style="left:'+Math.min(100,100*v.ref.value/mx).toFixed(1)+'%"></u>':'')+'</span><span class="bv">'+esc(d.text||nf(d.value))+'</span></div>'});
  return h+'</div>'+(v.ref?'<p class="vnote"><u></u> '+esc(v.ref.label)+'</p>':'')+(v.note?'<p class="vnote">'+esc(v.note)+'</p>':'')+'</figure>'}
function vCols(v){var W=320,H=112,pl=30,pr=6,pt=10,pb=20,d=v.data,n=d.length;if(!n)return '';var mx=Math.max.apply(null,d.map(function(x){return x.value}).concat([v.max||0,v.ref?v.ref.value:0]))||1,bw=(W-pl-pr)/n;
  var s='<svg viewBox="0 0 '+W+' '+H+'" class="vz" role="img" aria-label="'+esc(v.title)+'"><line class="v-base" x1="'+pl+'" y1="'+(H-pb)+'" x2="'+(W-pr)+'" y2="'+(H-pb)+'"/><text class="v-ax" x="'+(pl-4)+'" y="'+(pt+3)+'" text-anchor="end">'+nf(mx)+'</text><text class="v-ax" x="'+(pl-4)+'" y="'+(H-pb+3)+'" text-anchor="end">0</text>';
  d.forEach(function(x,i){var h=(H-pt-pb)*x.value/mx,xx=pl+i*bw+bw*0.14;s+='<rect class="vk-'+(KCLASS[x.k]||'accent')+'" x="'+xx.toFixed(1)+'" y="'+(H-pb-h).toFixed(1)+'" width="'+(bw*0.72).toFixed(1)+'" height="'+Math.max(h,x.value>0?1:0).toFixed(1)+'" rx="1.5"/>'});
  if(v.ref){var y=H-pb-(H-pt-pb)*v.ref.value/mx;s+='<line class="v-ref" x1="'+pl+'" y1="'+y.toFixed(1)+'" x2="'+(W-pr)+'" y2="'+y.toFixed(1)+'"/><text class="v-ax" x="'+(W-pr)+'" y="'+(y-3).toFixed(1)+'" text-anchor="end">'+esc(v.ref.label)+'</text>'}
  (v.ticks||[0,Math.floor((n-1)/2),n-1]).forEach(function(i){if(d[i])s+='<text class="v-ax" x="'+(pl+i*bw+bw/2).toFixed(1)+'" y="'+(H-5)+'" text-anchor="middle">'+esc(d[i].label)+'</text>'});
  return '<figure class="viz"><figcaption>'+esc(v.title)+'</figcaption>'+s+'</svg>'+(v.note?'<p class="vnote">'+esc(v.note)+'</p>':'')+'</figure>'}
function vLine(v){var W=320,H=132,pl=34,pr=8,pt=10,pb=22,p=v.pts,n=p.length;if(n<2)return '';
  var ys=p.map(function(a){return a.y}),dlo=Math.min.apply(null,ys),dhi=Math.max.apply(null,ys),lo=dlo,hi=dhi;if(v.band){lo=Math.min(lo,v.band.lo);hi=Math.max(hi,v.band.hi)}
  var pad=(hi-lo)*0.12||1;lo-=pad;hi+=pad;
  function X(i){return pl+(W-pl-pr)*i/(n-1)}function Y(y){return pt+(H-pt-pb)*(1-(y-lo)/(hi-lo))}
  var d=p.map(function(a,i){return (i?'L':'M')+X(i).toFixed(1)+' '+Y(a.y).toFixed(1)}).join(' ');
  var s='<svg viewBox="0 0 '+W+' '+H+'" class="vz" role="img" aria-label="'+esc(v.title)+'">';
  if(v.band)s+='<rect class="v-band" x="'+pl+'" y="'+Y(v.band.hi).toFixed(1)+'" width="'+(W-pl-pr)+'" height="'+(Y(v.band.lo)-Y(v.band.hi)).toFixed(1)+'"/><text class="v-ax" x="'+(W-pr-2)+'" y="'+(Y(v.band.hi)+10).toFixed(1)+'" text-anchor="end">'+esc(v.band.label||'')+'</text>';
  s+='<line class="v-base" x1="'+pl+'" y1="'+(H-pb)+'" x2="'+(W-pr)+'" y2="'+(H-pb)+'"/><path class="v-area" d="'+d+' L'+X(n-1).toFixed(1)+' '+(H-pb)+' L'+X(0).toFixed(1)+' '+(H-pb)+' Z"/><path class="v-line" d="'+d+'"/>';
  var yh=v.band?v.band.hi:dhi,yl=v.band?v.band.lo:dlo;s+='<text class="v-ax" x="'+(pl-4)+'" y="'+(Y(yh)+3).toFixed(1)+'" text-anchor="end">'+nf(yh)+'</text><text class="v-ax" x="'+(pl-4)+'" y="'+(Y(yl)+3).toFixed(1)+'" text-anchor="end">'+nf(yl)+'</text>';
  if(p[0].k)p.forEach(function(a,i){if(i%2===0||n<20)s+='<circle class="vk-'+(KCLASS[a.k]||'accent')+'" cx="'+X(i).toFixed(1)+'" cy="'+Y(a.y).toFixed(1)+'" r="2.6"/>'});
  if(v.now!=null){var xn=X(v.now);s+='<line class="v-now" x1="'+xn.toFixed(1)+'" y1="'+pt+'" x2="'+xn.toFixed(1)+'" y2="'+(H-pb)+'"/><text class="v-ax" x="'+(xn+3).toFixed(1)+'" y="'+(pt+8)+'">now</text>'}
  (v.ticks||[]).forEach(function(t){s+='<text class="v-ax" x="'+X(t.i).toFixed(1)+'" y="'+(H-6)+'" text-anchor="'+(t.i===0?'start':t.i===n-1?'end':'middle')+'">'+esc(t.label)+'</text>'});
  return '<figure class="viz"><figcaption>'+esc(v.title)+'</figcaption>'+s+'</svg>'+(v.note?'<p class="vnote">'+esc(v.note)+'</p>':'')+'</figure>'}
function vScale(v){var tot=v.max-v.min,prev=v.min,bar='',lab='';
  v.segs.forEach(function(g){var w=(Math.min(g.to,v.max)-prev)/tot*100;bar+='<i class="vk-'+(KCLASS[g.k]||'accent')+'" style="width:'+w.toFixed(2)+'%"></i>';lab+='<span style="width:'+w.toFixed(2)+'%">'+esc(g.label)+'</span>';prev=g.to});
  var pos=Math.max(0,Math.min(1,(v.value-v.min)/tot))*100;
  return '<figure class="viz"><figcaption>'+esc(v.title)+'</figcaption><div class="sc"><div class="sc-bar">'+bar+'<b style="left:'+pos.toFixed(1)+'%"></b></div><div class="sc-lab">'+lab+'</div></div>'+(v.note?'<p class="vnote">'+esc(v.note)+'</p>':'')+'</figure>'}
function vRadar(v){var S=280,C=S/2,Rr=118,mx=v.maxKm,s='<svg viewBox="0 0 '+S+' '+S+'" class="vz radar" role="img" aria-label="'+esc(v.title)+'">';
  v.rings.forEach(function(k){var r=Rr*k/mx;s+='<circle class="v-ring" cx="'+C+'" cy="'+C+'" r="'+r.toFixed(1)+'"/><text class="v-ax" x="'+(C+3)+'" y="'+(C-r+10).toFixed(1)+'">'+k+' km</text>'});
  s+='<line class="v-ring" x1="'+C+'" y1="12" x2="'+C+'" y2="'+(S-12)+'"/><line class="v-ring" x1="12" y1="'+C+'" x2="'+(S-12)+'" y2="'+C+'"/><text class="v-ax" x="'+(C+4)+'" y="12">N</text>';
  var placed=[];v.pts.forEach(function(p,i){var x=C+Rr*p.dx/mx,y=C-Rr*p.dy/mx;s+='<circle class="vk-'+(KCLASS[p.k]||'accent')+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4"/>';var clash=placed.some(function(q){return Math.abs(q[0]-x)<46&&Math.abs(q[1]-y)<11});if(i<v.labelN&&p.label&&!clash&&x<S-50){placed.push([x,y]);s+='<text class="v-ax v-lbl" x="'+(x+6).toFixed(1)+'" y="'+(y+3).toFixed(1)+'">'+esc(p.label)+'</text>'}});
  s+='<path class="v-you" d="M'+(C-5)+' '+C+'h10M'+C+' '+(C-5)+'v10"/>';
  return '<figure class="viz"><figcaption>'+esc(v.title)+'</figcaption>'+s+'</svg>'+(v.note?'<p class="vnote">'+esc(v.note)+'</p>':'')+'</figure>'}
function vDay(v){var W=320,H=64,pl=8,pr=8,w=W-pl-pr;function X(h){return pl+w*h/24}
  var s='<svg viewBox="0 0 '+W+' '+H+'" class="vz" role="img" aria-label="'+esc(v.title)+'"><rect class="v-night" x="'+pl+'" y="16" width="'+w+'" height="18" rx="4"/><rect class="vk-warn" x="'+X(v.rise).toFixed(1)+'" y="16" width="'+(X(v.set)-X(v.rise)).toFixed(1)+'" height="18" rx="4" style="opacity:.75"/>';
  [0,6,12,18,24].forEach(function(h){s+='<text class="v-ax" x="'+X(h).toFixed(1)+'" y="'+(H-4)+'" text-anchor="'+(h===0?'start':h===24?'end':'middle')+'">'+(h<10?'0':'')+h+':00</text>'});
  s+='<text class="v-ax" x="'+X(v.rise).toFixed(1)+'" y="12" text-anchor="middle">'+esc(v.riseLabel)+'</text><text class="v-ax" x="'+X(v.set).toFixed(1)+'" y="12" text-anchor="middle">'+esc(v.setLabel)+'</text>';
  if(v.now!=null)s+='<line class="v-now" x1="'+X(v.now).toFixed(1)+'" y1="14" x2="'+X(v.now).toFixed(1)+'" y2="38"/>';
  return '<figure class="viz"><figcaption>'+esc(v.title)+'</figcaption>'+s+'</svg></figure>'}
function vizHTML(v){try{return ({bars:vBars,columns:vCols,line:vLine,scale:vScale,radar:vRadar,daybar:vDay})[v.type](v)||''}catch(e){return ''}}
function cardsHTML(cs){return '<ul class="arts">'+cs.map(function(c){var im=safeUrl(c.img);return '<li>'+(im?'<img loading="lazy" referrerpolicy="no-referrer" alt="" src="'+esc(im)+'">':'')+'<div><b>'+esc(c.title)+'</b>'+(c.sub?'<small>'+esc(c.sub)+'</small>':'')+(c.text?'<p>'+esc(c.text)+'</p>':'')+(safeUrl(c.href)?'<a href="'+esc(c.href)+'" target="_blank" rel="noopener">Read more ↗</a>':'')+'</div></li>'}).join('')+'</ul>'}
function galleryHTML(im){return '<div class="gal">'+im.map(function(i){var s=safeUrl(i.src);if(!s)return '';var f='<figure><img loading="lazy" referrerpolicy="no-referrer" alt="'+esc(i.cap)+'" src="'+esc(s)+'"><figcaption>'+esc(i.cap)+(i.credit?'<small>'+esc(i.credit)+'</small>':'')+'</figcaption></figure>';return safeUrl(i.href)?'<a href="'+esc(i.href)+'" target="_blank" rel="noopener">'+f+'</a>':f}).join('')+'</div>'}

/* ---------- new and upgraded renderers ---------- */
function wrapR(id,fn){var o=R[id];R[id]=function(t,c){var pv=o(t,c);try{fn(pv,t,c)}catch(e){}return pv}}
function wrapRUN(id,fn){var o=RUN[id];RUN[id]=function(c,get,first){return o(c,get,first).then(function(pv){return Promise.resolve().then(function(){return fn(pv,c,get)}).then(function(){return pv},function(){return pv})})}}
function hhmm(x){return new Date(x).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})}
function distTxt(km){return km<1?Math.round(km*1000)+' m':r1(km,1)+' km'}
R['wiki-geo']=function(t,c){var ps=((J(t).query||{}).pages)||[],cards=ps.map(function(p){var co=p.coordinates&&p.coordinates[0],km=co?hav(lat0(c),lon0(c),co.lat,co.lon):99;return {km:km,title:p.title,sub:distTxt(km)+' away',text:trunc(strip(p.extract||''),460),img:p.thumbnail&&p.thumbnail.source,href:'https://en.wikipedia.org/?curid='+p.pageid}}).sort(function(a,b){return a.km-b.km});
  return {headline:cards.length+' Wikipedia articles within 2 km. Closest: '+(cards[0]?cards[0].title:'none'),cards:cards.slice(0,6),flag:'Text from Wikipedia, licensed CC BY-SA 4.0. Each article links to its page and authors.'}};
R['commons']=function(t,c){var ps=((J(t).query||{}).pages)||[],im=ps.filter(function(p){return p.imageinfo&&p.imageinfo[0]&&p.imageinfo[0].thumburl}).sort(function(a,b){return (a.index||0)-(b.index||0)}).slice(0,8).map(function(p){var ii=p.imageinfo[0],em=ii.extmetadata||{};
  return {src:ii.thumburl,href:ii.descriptionurl,cap:p.title.replace(/^File:/,'').replace(/\.[A-Za-z0-9]+$/,'').replace(/_/g,' '),credit:[strip((em.Artist||{}).value),(em.LicenseShortName||{}).value].filter(Boolean).join(' · ')}});
  return {headline:im.length+' freely licensed photos taken nearby',images:im,flag:'Each photo has its own licence and author, shown under it. Check before reusing.'}};
R['inat']=function(t){var d=J(t),im=d.results.filter(function(o){return o.photos&&o.photos[0]}).slice(0,6).map(function(o){var tx=o.taxon||{},ph=o.photos[0];return {src:(ph.url||'').replace('square','medium'),href:o.uri,cap:(tx.preferred_common_name||tx.name||'Unidentified')+' · '+(o.observed_on||''),credit:strip(ph.attribution||'')}});
  return {headline:d.total_results+' wildlife sightings within 3 km. Newest '+(d.results[0]?d.results[0].observed_on:''),images:im,items:d.results.slice(0,6).map(function(o){var tx=o.taxon||{};return {t:o.observed_on,x:(tx.preferred_common_name||tx.name||o.species_guess||'Unidentified')+' · '+trunc(o.place_guess||'',50)}}),itemsTitle:'Latest first'}};

wrapR('om-forecast',function(pv,t){var d=J(t),h=d.hourly;if(h&&h.time){var now=Date.now(),i0=0;while(i0<h.time.length&&new Date(h.time[i0]).getTime()<now-36e5)i0++;var T=h.time.slice(i0,i0+25),Y=h.temperature_2m.slice(i0,i0+25);
    if(T.length>3){var hr=function(s){return s.slice(11,16)};pv.viz=[{type:'line',title:'Temperature, next 24 hours (°C)',pts:T.map(function(x,i){return {y:Y[i]}}),now:0,ticks:[0,6,12,18,24].filter(function(i){return i<T.length}).map(function(i){return {i:i,label:hr(T[i])}})}]}}
  var m=d.minutely_15;if(m&&m.time.length){var cols={type:'columns',title:'Rain, next two hours (mm per 15 minutes)',data:m.time.slice(0,8).map(function(x,i){return {label:x.slice(11),value:m.precipitation[i],k:m.precipitation[i]>0.5?'warn':'ok'}}),max:1,ticks:[0,3,7]};(pv.viz=pv.viz||[]).push(cols);pv.items=[]}});
wrapR('om-aq',function(pv,t){var c=J(t).current,v=[];
  v.push({type:'scale',title:'European air quality index',min:0,max:120,value:c.european_aqi,segs:[{to:20,label:'Good',k:'good'},{to:40,label:'Fair',k:'ok'},{to:60,label:'Mod',k:'warn'},{to:80,label:'Poor',k:'bad'},{to:100,label:'V poor',k:'bad'},{to:120,label:'Extr',k:'bad'}]});
  if(c.uv_index!=null)v.push({type:'scale',title:'UV index',min:0,max:12,value:c.uv_index,segs:[{to:3,label:'Low',k:'good'},{to:6,label:'Moderate',k:'ok'},{to:8,label:'High',k:'warn'},{to:11,label:'Very high',k:'bad'},{to:12,label:'',k:'bad'}]});
  pv.viz=v});
wrapR('sensorcomm',function(pv,t,c){var d=J(t),by={};d.forEach(function(r){var id=r.sensor.id,o=by[id]||(by[id]={lat:+r.location.latitude,lon:+r.location.longitude,v:{}});r.sensordatavalues.forEach(function(x){o.v[x.value_type]=parseFloat(x.value)})});
  var data=Object.keys(by).map(function(k){var o=by[k];o.km=hav(lat0(c),lon0(c),o.lat,o.lon);return o}).filter(function(o){return o.v.P2!=null&&o.v.P2>=0&&o.v.P2<1000}).sort(function(a,b){return a.km-b.km}).slice(0,8).map(function(o){return {label:o.km.toFixed(1)+' km',value:o.v.P2,text:o.v.P2+' µg/m³',k:lk(bandOf('pm2_5',o.v.P2))}});
  if(data.length)pv.viz=[{type:'bars',title:'PM2.5 at each sensor',data:data,max:Math.max(20,Math.max.apply(null,data.map(function(x){return x.value}))),ref:{value:WHO.pm2_5,label:'WHO daily guideline, 15 µg/m³'}}]});
function augCI(pv){var a=pv._ci;if(!a||a.length<4)return;var now=Date.now(),i0=0;while(i0<a.length-1&&new Date(a[i0].t).getTime()+18e5<now)i0++;var s=a.slice(i0);
  var hh=hhmm;
  var viz=[{type:'line',title:'Forecast, next 24 hours (gCO₂/kWh)',pts:s.map(function(x){return {y:x.v,k:CI_LVL[x.i]||'info'}}),now:0,ticks:[0,16,32,s.length-1].filter(function(i,j,arr){return i<s.length&&arr.indexOf(i)===j}).map(function(i){return {i:i,label:hh(s[i].t)}}),note:'Dot colour shows the grid’s own rating: green low, teal moderate, amber high, red very high.'}];
  if(pv._mix&&pv._mix.length)viz.push({type:'bars',title:'Where the power comes from now (%)',data:pv._mix.map(function(g){return {label:g.fuel,value:g.perc,text:g.perc+'%',k:/wind|solar|nuclear|hydro|biomass/i.test(g.fuel)?'good':/gas|coal|oil/i.test(g.fuel)?'warn':'info'}}),max:100});
  pv.viz=viz;pv.items=[]}
wrapRUN('ci-nat',augCI);wrapRUN('ci-reg',augCI);
wrapR('ci-gen',function(pv){var it=pv.items.slice();pv.viz=[{type:'bars',title:'Share of GB generation now (%)',data:it.map(function(i){var f=i.x;return {label:f,value:parseFloat(i.t),text:i.t,k:/wind|solar|nuclear|hydro|biomass/i.test(f)?'good':/gas|coal|oil/i.test(f)?'warn':'info'}}),max:50}];pv.items=[]});
wrapR('elexon',function(pv){var it=pv.items.slice();pv.viz=[{type:'bars',title:'Generation by fuel (GW)',data:it.map(function(i){return {label:i.x,value:parseFloat(i.t),text:i.t,k:/WIND|SOLAR|NUCLEAR|NPSHYD|BIOMASS/.test(i.x)?'good':/CCGT|OCGT|COAL|OIL/.test(i.x)?'warn':'info'}}),max:Math.max.apply(null,it.map(function(i){return parseFloat(i.t)}))}];pv.items=[]});
wrapR('police',function(pv){var it=pv.items.slice();pv.viz=[{type:'bars',title:'Crimes by type',data:it.map(function(i){return {label:i.x,value:+i.t,text:String(i.t)}}),max:Math.max.apply(null,it.map(function(i){return +i.t}))}];pv.items=[]});
wrapR('fsa',function(pv,t){var by={};((J(t).establishments)||[]).forEach(function(x){if(/^\d$/.test(x.RatingValue))by[x.RatingValue]=(by[x.RatingValue]||0)+1});var ks=Object.keys(by).sort(function(a,b){return b-a});
  if(ks.length)pv.viz=[{type:'bars',title:'Hygiene ratings nearby (5 is best)',data:ks.map(function(k){return {label:'Rated '+k,value:by[k],text:String(by[k]),k:k>=4?'good':k==3?'ok':'bad'}}),max:Math.max.apply(null,ks.map(function(k){return by[k]}))}]});
wrapR('swpc-kp',function(pv,t){var d=J(t).filter(function(r){return Array.isArray(r)?r[0]!=='time_tag':true}).map(function(r){return Array.isArray(r)?{time:r[0],kp:+r[1]}:{time:r.time_tag,kp:+(r.Kp!=null?r.Kp:r.kp_index)}}).slice(-16),l=d[d.length-1];
  pv.viz=[{type:'scale',title:'Kp index now',min:0,max:9,value:l.kp,segs:[{to:4,label:'Quiet',k:'info'},{to:5,label:'Active',k:'ok'},{to:7,label:'Storm',k:'warn'},{to:9,label:'Severe',k:'bad'}]},
    {type:'columns',title:'Kp index, last two days',data:d.map(function(r){return {label:String(r.time).slice(5,10)+' '+String(r.time).slice(11,13)+'h',value:r.kp,k:r.kp>=7?'bad':r.kp>=5?'warn':r.kp>=4?'ok':'info'}}),max:9,ref:{value:5,label:'storm'},ticks:[0,7,15]}];pv.items=[]});
wrapR('sunapi',function(pv,t,c){var r=J(t).results,a=new Date(r.sunrise),b=new Date(r.sunset),n=new Date();function H(d){return d.getHours()+d.getMinutes()/60}
  pv.viz=[{type:'daybar',title:'Daylight today',rise:H(a),set:H(b),now:H(n),riseLabel:a.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),setLabel:b.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]});
function radarFrom(pts,c,label){var P=pts.map(function(p){var dx=(p.lon-lon0(c))*Math.cos(lat0(c)*Math.PI/180)*111.32,dy=(p.lat-lat0(c))*110.57;return {dx:dx,dy:dy,km:Math.sqrt(dx*dx+dy*dy),label:p.label,k:p.alt==null?'info':p.alt<1500?'warn':p.alt<5000?'ok':'info'}}).sort(function(a,b){return a.km-b.km});
  if(!P.length)return null;P=P.slice(0,12);var far=P[P.length-1].km,mx=far<=10?10:far<=20?20:far<=40?40:far<=80?80:far<=160?160:320;
  return {type:'radar',title:'Aircraft around you ('+label+')',pts:P,maxKm:mx,rings:[mx/4,mx/2,mx].map(function(x){return +x.toFixed(0)}),labelN:6,note:'Nearest 12 aircraft. Orange: under 1,500 m. Teal: 1,500 to 5,000 m. Grey: higher. North is up.'}}
wrapR('opensky',function(pv,t,c){var s=(J(t).states||[]).filter(function(x){return !x[8]&&x[5]!=null&&x[6]!=null});var v=radarFrom(s.map(function(x){return {lat:x[6],lon:x[5],alt:x[13]!=null?x[13]:x[7],label:(x[1]||'').trim()}}),c,'OpenSky');if(v){pv.viz=[v];pv.items=[]}});
wrapR('adsblol',function(pv,t,c){var s=(J(t).ac||[]).filter(function(x){return x.alt_baro!=='ground'&&x.lat!=null});var v=radarFrom(s.map(function(x){return {lat:x.lat,lon:x.lon,alt:typeof x.alt_baro==='number'?x.alt_baro*0.3048:null,label:(x.flight||x.r||'').trim()}}),c,'adsb.lol');if(v){pv.viz=[v];pv.items=[]}});
wrapRUN('ea-levels',function(pv,c,get){if(!pv._m)return;return get(String(pv._m).replace(/^http:/,'https:')+'/readings?_sorted&_limit=96').then(function(r){var it=(J(r.text).items||[]).slice().reverse().filter(function(x){return typeof x.value==='number'});if(it.length<4)return;
  var sc=pv._sc||{},hh=hhmm,n=it.length;
  pv.viz=[{type:'line',title:'Water level, last '+Math.round(n/4)+' hours (m)',pts:it.map(function(x){return {y:x.value}}),band:sc.typicalRangeLow!=null?{lo:sc.typicalRangeLow,hi:sc.typicalRangeHigh,label:'Usual range'}:undefined,ticks:[0,Math.floor((n-1)/2),n-1].map(function(i){return {i:i,label:hh(it[i].dateTime)}})}]})});
wrapRUN('ea-rain',function(pv,c,get){if(!pv._m)return;return get(String(pv._m).replace(/^http:/,'https:')+'/readings?_sorted&_limit=24').then(function(r){var it=(J(r.text).items||[]).slice().reverse().filter(function(x){return typeof x.value==='number'});if(it.length<3)return;
  var hh=hhmm,tot=it.reduce(function(s,x){return s+x.value},0);
  pv.viz=[{type:'columns',title:'Rain at the nearest gauge, last '+Math.round(it.length/4)+' hours (mm per 15 minutes)',data:it.map(function(x){return {label:hh(x.dateTime),value:x.value,k:x.value*4>=2.5?'warn':'ok'}}),max:1,ticks:[0,Math.floor((it.length-1)/2),it.length-1],note:r1(tot,1)+' mm in total over this period.'}]})});

/* Per-source overrides: request headers, heavy files skipped by "Load all", and what an earlier server-side probe predicted. */
var EXTRA={
  fsa:{headers:{'x-api-version':'2','Accept':'application/json'}},
  mobdb:{heavy:true},'swpc-oval':{heavy:true},inat:{},
  opensky:{hint:'An earlier probe saw the CORS header locked to opensky-network.org, so the browser will probably block this.'},
  adsblol:{hint:'No CORS header was seen, so the browser will probably block this.'},
  'bbc-berks':{hint:'No CORS header was seen, so the browser will probably block this.'},
  'bbc-surrey':{hint:'No CORS header was seen, so the browser will probably block this.'},
  meteoalarm:{hint:'No CORS header was seen, so the browser will probably block this.'},
  'bsky-pub':{hint:'Returned 403 in an earlier probe.'},'masto-local':{hint:'Needs a login; returned 422 earlier.'},
  'gdelt-geo':{hint:'Returned 404 earlier; the API looks retired.'},airplanes:{hint:'Returned 403: they ask projects to contact them first.'},
  ocm:{hint:'Needs a free API key.'},aurorawatch:{hint:'Plain http, and the hostname did not resolve earlier.'},
  'metno-now':{hint:'Nordic countries only.'},'nws-points':{hint:'US only.'},'nws-alerts':{hint:'US only.'},brightsky:{hint:'Germany only.'},
  'ea-levels':{run:'ea-levels'},'ea-rain':{run:'ea-rain'},'om-forecast':{run:'om-forecast'},'ci-nat':{run:'ci-nat'},'ci-reg':{run:'ci-reg'},
  bdc:{hint:'Meant for browsers, so it may work here even though it failed from a server.'},
  overpass:{hint:'Failed from a server; may work from your phone.'},'usgs-water':{hint:'Failed from a server; may work from your phone.'}
};
SRC.forEach(function(s){var e=EXTRA[s.id];if(e)Object.keys(e).forEach(function(k){s[k]=e[k]})});
var NOT_TESTABLE=SRC.filter(function(s){return !s.u});

/* ---------- app ---------- */
if(IN_BROWSER){(function(){
var $=function(s,r){return (r||document).querySelector(s)};
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var PRESETS=[{n:'Windsor',lat:'51.4839',lon:'-0.6044',pc:'SL4'},{n:'Guildford',lat:'51.2362',lon:'-0.5704',pc:'GU1'},{n:'London',lat:'51.5072',lon:'-0.1276',pc:'SW1A'},{n:'New York',lat:'40.7128',lon:'-74.0060',pc:''},{n:'Oslo',lat:'59.9139',lon:'10.7522',pc:''}];
var ctx={place:'Windsor',lat:'51.4839',lon:'-0.6044',pc:'SL4'};
try{var sv=JSON.parse(lsGet('hlx-ctx')||'null');if(sv&&sv.lat&&sv.lon)ctx=sv}catch(e){}
var verdicts={};try{verdicts=JSON.parse(lsGet('hlx-v')||'{}')}catch(e){}
var results={},F={cat:'all',q:''},gen=0,queue=[],active=0,MAX=4;
var TESTABLE=SRC.filter(function(s){return s.u}),BYID={};TESTABLE.forEach(function(s){BYID[s.id]=s});
function valid(){var a=parseFloat(ctx.lat),b=parseFloat(ctx.lon);return isFinite(a)&&isFinite(b)&&Math.abs(a)<=90&&Math.abs(b)<=180}
function urlFor(s){if(!valid())return null;try{return s.u(ctx)}catch(e){return null}}

function get(url,opts){opts=opts||{};var t0=performance.now(),ac=new AbortController(),to=setTimeout(function(){ac.abort()},25000);
  return fetch(url,{headers:opts.headers||{},signal:ac.signal,cache:'no-store'}).then(function(r){return r.text().then(function(text){clearTimeout(to);
    var ms=Math.round(performance.now()-t0);
    if(!r.ok){var e=new Error('HTTP '+r.status+' '+trunc(strip(text),140));e.status=r.status;e.ms=ms;e.raw=text;throw e}
    return {status:r.status,text:text,ms:ms}})},function(err){clearTimeout(to);
    var e=new Error(err&&err.name==='AbortError'?'Timed out after 25 seconds.':'The browser blocked this call, or you are offline. That is usually a missing CORS header, so this feed needs a proxy.');e.blocked=true;e.ms=Math.round(performance.now()-t0);throw e})}

function generic(t){var d;try{d=J(t)}catch(e){var it=rss(t);if(it.length)return {headline:it.length+' feed items',items:it.slice(0,6).map(function(x){return {t:clock(x.date),x:trunc(x.title,100)}})};return {headline:'Text response, '+t.length+' characters',rows:[['Start',trunc(strip(t),200)]]}}
  if(Array.isArray(d))return {headline:d.length+' items',rows:d[0]&&typeof d[0]==='object'?Object.keys(d[0]).slice(0,6).map(function(k){return [k,trunc(JSON.stringify(d[0][k]),80)]}):[]};
  return {headline:'JSON object with '+Object.keys(d).length+' fields',rows:Object.keys(d).slice(0,8).map(function(k){return [k,trunc(JSON.stringify(d[k]),80)]})}}

/* load one source; queue limits concurrency to 4 */
function load(id){var s=BYID[id],url=urlFor(s),g=gen;if(!url)return Promise.resolve();
  results[id]={state:'loading'};paint(id);var t0=performance.now();
  return get(url,{headers:s.headers}).then(function(r){
    var p=s.run?RUN[s.run](ctx,function(u){return get(u)},r):Promise.resolve((R[id]||generic)(r.text,ctx,s));
    return Promise.resolve(p).then(function(pv){if(g!==gen)return;results[id]={state:'ok',ms:Math.round(performance.now()-t0),pv:pv,raw:r.text,at:Date.now(),status:r.status}})
  }).catch(function(e){if(g!==gen)return;results[id]={state:'err',ms:e.ms||Math.round(performance.now()-t0),msg:e.message,blocked:!!e.blocked,status:e.status,raw:e.raw,at:Date.now(),soft:!!e.soft}}).then(function(){if(g!==gen)return;paint(id);summary()})}
function enqueue(id,force){var r=results[id];if(!BYID[id]||(!force&&r&&(r.state==='ok'||r.state==='loading'||r.state==='err')))return;if(queue.indexOf(id)<0)queue.push(id);pump()}
function pump(){while(active<MAX&&queue.length){var id=queue.shift();active++;load(id).then(function(){active--;pump()},function(){active--;pump()})}}

/* ---------- drawing ---------- */
function pvHTML(pv){var h='<p class="head">'+esc(pv.headline||'')+'</p>';
  if(pv.level)h+='<p class="lvl lvl-'+esc(pv.level.k)+'"><b>'+esc(pv.level.label)+'</b> '+esc(pv.level.text)+'</p>';
  if(pv.viz)pv.viz.forEach(function(v){h+=vizHTML(v)});
  if(pv.rows&&pv.rows.length)h+='<dl class="kv">'+pv.rows.map(function(r){return '<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+(r[2]?'<small class="note'+(r[3]?' n-'+esc(r[3]):'')+'">'+esc(r[2])+'</small>':'')+'</dd>'}).join('')+'</dl>';
  if(pv.cards&&pv.cards.length)h+=cardsHTML(pv.cards);
  if(pv.images&&pv.images.length)h+=galleryHTML(pv.images);
  if(pv.items&&pv.items.length)h+=(pv.itemsTitle?'<p class="it">'+esc(pv.itemsTitle)+'</p>':'')+'<ul class="items">'+pv.items.map(function(i){return '<li>'+(i.t!==''&&i.t!=null?'<b>'+esc(i.t)+'</b>':'')+'<span>'+esc(i.x)+'</span></li>'}).join('')+'</ul>';
  if(pv.flag)h+='<p class="flag">'+esc(pv.flag)+'</p>';return h}
function card(s){var url=urlFor(s);
  return '<article class="card" id="c-'+s.id+'"><div class="top"><h3>'+esc(s.name)+'</h3><span class="scope">'+esc(s.scope)+'</span></div>'
   +'<p class="desc">'+esc(s.desc)+'</p>'
   +(s.hint?'<p class="hint">'+esc(s.hint)+'</p>':'')
   +'<div class="res" aria-live="polite"></div>'
   +'<div class="acts"><button class="btn small" data-load="'+s.id+'">Reload</button>'+(url?'<a class="btn small" href="'+esc(url)+'" target="_blank" rel="noopener">Raw ↗</a>':'')+'</div>'
   +'<div class="verdict" role="group" aria-label="Your verdict"><button data-v="keep">Keep</button><button data-v="maybe">Maybe</button><button data-v="scrap">Scrap</button></div>'
   +'</article>'}
function paint(id){var el=document.getElementById('c-'+id);if(!el)return;var r=results[id],box=el.querySelector('.res'),s=BYID[id];
  el.querySelectorAll('.verdict button').forEach(function(b){b.setAttribute('aria-pressed',verdicts[id]===b.dataset.v?'true':'false')});
  el.classList.toggle('failed',!!(r&&r.state==='err'));
  var lb=el.querySelector('[data-load]');lb.textContent=s.heavy&&!r?'Load (large file)':'Reload';
  if(!r){box.innerHTML=s.heavy?'<p class="st wait">Large file, so it loads only when you ask.</p>':'<p class="st wait">Loads when you scroll to it.</p>';return}
  if(r.state==='loading'){box.innerHTML='<p class="st wait">Loading…</p><div class="skel"><i></i><i></i><i></i></div>';return}
  if(r.state==='err'){box.innerHTML='<p class="st bad">'+(r.soft?'Responded, but the data is not usable: ':'Failed: ')+esc(r.msg)+' <span class="ms">'+(r.ms?r.ms+' ms':'')+'</span></p>'+(r.raw?'<details class="raw"><summary>Raw response</summary><pre>'+esc(trunc(r.raw,1500))+'</pre></details>':'');return}
  box.innerHTML='<div class="pv">'+pvHTML(r.pv)+'</div><p class="st ok">Live from this device <span class="ms">'+r.ms+' ms · updated '+new Date(r.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</span></p><details class="raw"><summary>Raw response</summary><pre>'+esc(trunc(r.raw,2500))+'</pre></details>'}

var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var id=e.target.id.slice(2);io.unobserve(e.target);if(!BYID[id].heavy)enqueue(id)})},{rootMargin:'700px 0px'}):null;
function renderList(){var q=F.q.toLowerCase(),html='';
  CATS.forEach(function(c){if(F.cat!=='all'&&F.cat!==c.id)return;var items=TESTABLE.filter(function(s){return s.cat===c.id&&(!q||(s.name+' '+s.desc).toLowerCase().indexOf(q)>=0)});if(!items.length)return;
    html+='<section class="group"><h2>'+esc(c.name)+'<span class="count">'+items.length+'</span></h2>'+items.map(card).join('')+'</section>'});
  $('#list').innerHTML=html||'<p class="empty">No sources match.</p>';
  TESTABLE.forEach(function(s){var el=document.getElementById('c-'+s.id);if(!el)return;paint(s.id);var r=results[s.id];if(!r&&!s.heavy){if(io)io.observe(el);else enqueue(s.id)}})}
function summary(){var ok=0,bad=0,blocked=0,wait=0;TESTABLE.forEach(function(s){var r=results[s.id];if(!r)return;if(r.state==='ok')ok++;else if(r.state==='err'){bad++;if(r.blocked)blocked++}else wait++});
  $('#sum').textContent=(ok||bad)?ok+' working · '+bad+' failed'+(blocked?' ('+blocked+' blocked by the browser)':'')+(wait?' · '+wait+' loading':''):'Loading…'}

/* ---------- controls ---------- */
function setCtx(c){ctx=c;lsSet('hlx-ctx',JSON.stringify(ctx));gen++;queue=[];results={};syncFields();renderList();summary()}
function syncFields(){$('#f-place').value=ctx.place||'';$('#f-pc').value=ctx.pc||'';$('#f-lat').value=ctx.lat||'';$('#f-lon').value=ctx.lon||'';
  document.querySelectorAll('[data-preset]').forEach(function(b){var p=PRESETS.filter(function(x){return x.n===b.dataset.preset})[0];b.setAttribute('aria-pressed',p&&p.lat===ctx.lat&&p.lon===ctx.lon?'true':'false')})}
var lt;['#f-place','#f-pc','#f-lat','#f-lon'].forEach(function(s){$(s).addEventListener('input',function(){clearTimeout(lt);lt=setTimeout(function(){setCtx({place:$('#f-place').value.trim(),pc:$('#f-pc').value.trim().toUpperCase(),lat:$('#f-lat').value.trim(),lon:$('#f-lon').value.trim()})},600)})});
$('#geo').addEventListener('click',function(){var m=$('#geomsg');if(!navigator.geolocation){m.textContent='This browser has no location access.';return}
  m.textContent='Asking for your location…';
  navigator.geolocation.getCurrentPosition(function(p){var c={place:ctx.place,pc:'',lat:p.coords.latitude.toFixed(4),lon:p.coords.longitude.toFixed(4)};m.textContent='Got it. Looking up the place name…';setCtx(c);
    get('https://nominatim.openstreetmap.org/reverse?lat='+c.lat+'&lon='+c.lon+'&format=jsonv2&zoom=14').then(function(r){var a=J(r.text).address||{};var c2={lat:c.lat,lon:c.lon,place:a.suburb||a.village||a.town||a.city||c.place,pc:((a.postcode||'').split(' ')[0]||'').toUpperCase()};setCtx(c2);m.textContent='Location set to '+c2.place+'.'},function(){m.textContent='Location set. Enter a place name above.'})},
    function(e){m.textContent='Location was refused or unavailable ('+(e&&e.message||'error')+'). Type coordinates instead.'},{enableHighAccuracy:false,timeout:15000})});
document.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;
  if(t.dataset.preset){var p=PRESETS.filter(function(x){return x.n===t.dataset.preset})[0];setCtx({place:p.n,lat:p.lat,lon:p.lon,pc:p.pc});return}
  if(t.dataset.cat){F.cat=t.dataset.cat;document.querySelectorAll('[data-cat]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.cat===F.cat?'true':'false')});renderList();return}
  if(t.dataset.load){enqueue(t.dataset.load,true);return}
  if(t.dataset.v){var id=t.closest('.card').id.slice(2);if(verdicts[id]===t.dataset.v)delete verdicts[id];else verdicts[id]=t.dataset.v;lsSet('hlx-v',JSON.stringify(verdicts));paint(id);return}
});
$('#q').addEventListener('input',function(e){F.q=e.target.value.trim();renderList()});
$('#hidefail').addEventListener('change',function(e){$('#list').classList.toggle('hidefail',e.target.checked)});
$('#all').addEventListener('click',function(){TESTABLE.filter(function(s){return !s.heavy&&(F.cat==='all'||s.cat===F.cat)&&document.getElementById('c-'+s.id)}).forEach(function(s){enqueue(s.id,true)})});
$('#copy').addEventListener('click',function(){var rep=TESTABLE.filter(function(s){return results[s.id]||verdicts[s.id]}).map(function(s){var r=results[s.id]||{};return {id:s.id,name:s.name,verdict:verdicts[s.id]||null,works:r.state==='ok'?true:(r.state==='err'?false:null),ms:r.ms||null,blocked:r.blocked||undefined,error:r.state==='err'?r.msg:undefined,headline:r.pv&&r.pv.headline||undefined,meaning:r.pv&&r.pv.level?r.pv.level.label+': '+r.pv.level.text:undefined}});
  var out={place:ctx.place,lat:ctx.lat,lon:ctx.lon,when:new Date().toISOString(),ua:navigator.userAgent,results:rep},txt=JSON.stringify(out,null,1),ta=$('#report');ta.value=txt;ta.hidden=false;
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){$('#copymsg').textContent='Copied. Paste it into the chat.'},function(){ta.select();$('#copymsg').textContent='Select all and copy, then paste it into the chat.'})});

/* boot */
$('#cats').innerHTML=[{id:'all',name:'All'}].concat(CATS.filter(function(c){return TESTABLE.some(function(s){return s.cat===c.id})})).map(function(c){return '<button class="chip" data-cat="'+c.id+'" aria-pressed="'+(c.id==='all')+'">'+esc(c.name)+'</button>'}).join('');
$('#presets').innerHTML=PRESETS.map(function(p){return '<button class="chip" data-preset="'+esc(p.n)+'" aria-pressed="false">'+esc(p.n)+'</button>'}).join('');
$('#nt').innerHTML=NOT_TESTABLE.map(function(s){return '<li><b>'+esc(s.name)+'</b> <span>'+esc(s.scope)+' · '+esc({key:'needs a key',oauth:'needs a login',paid:'paid or limited',closed:'closed',unknown:'no known endpoint',open:'no direct call yet'}[s.auth]||'')+'</span><br>'+esc(s.note||s.desc)+'</li>'}).join('');
syncFields();renderList();summary();
})()}
if(typeof module!=='undefined')module.exports={SRC:SRC,R:R,RUN:RUN,CATS:CATS,vizHTML:vizHTML,cardsHTML:cardsHTML,galleryHTML:galleryHTML,TESTABLE:SRC.filter(function(s){return s.u})};
