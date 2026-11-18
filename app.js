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
  u:function(c){return 'https://api.open-meteo.com/v1/forecast?latitude='+c.lat+'&longitude='+c.lon+'&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&minutely_15=precipitation&forecast_minutely_15=8&timezone=auto'},
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
  u:function(c){return 'https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord='+enc(c.lat+'|'+c.lon)+'&gsradius=2000&gslimit=10&format=json&origin=*'},docs:'https://www.mediawiki.org/wiki/API:Geosearch',note:'Gives each tile a “story of this place” link.'});
add('places','commons','Wikimedia Commons nearby photos','Global','open','static','m','maybe','Geotagged freely licensed images near a point.',{
  u:function(c){return 'https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord='+enc(c.lat+'|'+c.lon)+'&gsradius=1000&gsnamespace=6&gslimit=10&format=json&origin=*'},docs:'https://www.mediawiki.org/wiki/API:Geosearch',note:'Licence varies per image.'});
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
  u:function(c){return 'https://api.inaturalist.org/v1/observations?lat='+c.lat+'&lng='+c.lon+'&radius=3&order_by=observed_on&order=desc&per_page=10'},docs:'https://api.inaturalist.org/v1/docs/',note:'About one request a second. Locations of sensitive species are obscured.'});
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

R['om-forecast']=function(t){var d=J(t);if(d.error)fail(d.reason);var c=d.current,u=d.current_units||{};
  var m=d.minutely_15,items=m?m.time.slice(0,8).map(function(x,i){return {t:x.slice(11),x:m.precipitation[i]+' mm'}}):[];
  return {headline:r1(c.temperature_2m)+' °C, '+(WMO[c.weather_code]||'code '+c.weather_code).toLowerCase(),
    rows:[['Feels like',r1(c.apparent_temperature)+' °C'],['Wind',r1(c.wind_speed_10m)+' '+(u.wind_speed_10m||'km/h')],['Rain now',c.precipitation+' mm'],['Model time',clock(c.time)+' ('+ago(c.time)+')']],items:items,itemsTitle:'Next two hours of rain, every 15 minutes'}};
R['om-ukmo']=function(t){var d=J(t);if(d.error)fail(d.reason);var c=d.current,h=d.hourly;
  var items=h?h.time.slice(0,6).map(function(x,i){return {t:x.slice(11),x:r1(h.temperature_2m[i])+' °C, '+h.precipitation[i]+' mm rain'}}):[];
  return {headline:r1(c.temperature_2m)+' °C, '+(WMO[c.weather_code]||'code '+c.weather_code).toLowerCase()+' (Met Office model)',rows:[['Wind',r1(c.wind_speed_10m)+' km/h'],['Rain now',c.precipitation+' mm'],['Model time',clock(c.time)]],items:items,itemsTitle:'Next hours'}};
R['om-aq']=function(t){var d=J(t);if(d.error)fail(d.reason);var c=d.current,rows=[['European AQI',c.european_aqi],['PM2.5',c.pm2_5+' µg/m³'],['PM10',c.pm10+' µg/m³'],['Nitrogen dioxide',c.nitrogen_dioxide+' µg/m³'],['Ozone',c.ozone+' µg/m³'],['UV index',c.uv_index]];
  var h=d.hourly;if(h)['alder_pollen','birch_pollen','grass_pollen'].forEach(function(k){var v=(h[k]||[]).filter(function(x){return x!=null});if(v.length)rows.push([k.replace('_pollen',' pollen'),'up to '+Math.max.apply(null,v)+' grains/m³']);else rows.push([k.replace('_pollen',' pollen'),'no data (out of season)'])});
  var a=c.european_aqi,label=a<=20?'good':a<=40?'fair':a<=60?'moderate':a<=80?'poor':'very poor';
  return {headline:'Air quality '+label+' (AQI '+a+')',rows:rows,flag:'A model on an 11 km grid, not a measurement at your street.'}};
R['om-flood']=function(t){var d=J(t);if(d.error)fail(d.reason);var q=d.daily;return {headline:'River discharge '+r1(q.river_discharge[0])+' m³/s today',rows:[['Grid cell',d.latitude.toFixed(3)+', '+d.longitude.toFixed(3)]],items:q.time.map(function(x,i){return {t:x.slice(5),x:r1(q.river_discharge[i])+' m³/s'}}),itemsTitle:'Forecast'}};
R['om-marine']=function(t){var d=J(t);if(d.error)fail(d.reason);var c=d.current;if(c.wave_height==null)fail('No wave data here. This point is inland.');return {headline:'Waves '+c.wave_height+' m, period '+c.wave_period+' s',rows:[['Sea temperature',c.sea_surface_temperature+' °C']]}};
R['om-geo']=function(t){var d=J(t);var r=d.results||[];return {headline:r.length?r[0].name+', '+(r[0].admin1||'')+', '+r[0].country:'No match',items:r.map(function(x){return {t:x.country_code,x:x.name+(x.admin1?', '+x.admin1:'')+' ('+x.latitude.toFixed(2)+', '+x.longitude.toFixed(2)+')'}}),itemsTitle:'Matches'}};
R['metno-loc']=function(t){var d=J(t),ts=d.properties.timeseries,n=ts[0],i=n.data.instant.details,n1=n.data.next_1_hours;
  return {headline:r1(i.air_temperature)+' °C, '+(n1?n1.summary.symbol_code.replace(/_/g,' '):'forecast'),rows:[['Wind',r1(i.wind_speed)+' m/s'],['Humidity',r1(i.relative_humidity)+' %'],['Rain next hour',n1?n1.details.precipitation_amount+' mm':'n/a'],['Valid',clock(n.time)],['Forecast hours',ts.length]]}};
R['rainviewer']=function(t){var d=J(t),p=d.radar.past||[],f=d.radar.nowcast||[],l=p[p.length-1];
  return {headline:p.length+' radar frames, newest '+(l?ago(l.time):'none'),rows:[['Newest frame',l?clock(l.time):'n/a'],['Past frames',p.length],['Forecast frames',f.length]],flag:f.length?'':'No forecast (nowcast) frames, so this is past radar only.'}};
R['wttr']=function(t){var d=J(t),c=d.current_condition[0],a=d.nearest_area[0];
  return {headline:c.temp_C+' °C, '+c.weatherDesc[0].value.toLowerCase()+' near '+a.areaName[0].value,rows:[['Feels like',c.FeelsLikeC+' °C'],['Humidity',c.humidity+' %'],['Wind',c.windspeedKmph+' km/h '+c.winddir16Point],['Area',a.areaName[0].value+', '+a.region[0].value]]}};
R['sensorcomm']=function(t,c){var d=J(t),by={};
  d.forEach(function(r){var id=r.sensor.id,o=by[id]||(by[id]={lat:+r.location.latitude,lon:+r.location.longitude,v:{},ts:r.timestamp});r.sensordatavalues.forEach(function(x){o.v[x.value_type]=parseFloat(x.value)});o.ts=r.timestamp});
  var list=Object.keys(by).map(function(k){var o=by[k];o.km=hav(lat0(c),lon0(c),o.lat,o.lon);return o}).sort(function(a,b){return a.km-b.km});
  var odd=0;var items=list.slice(0,8).map(function(o){var b=[];if(o.v.P2!=null)b.push('PM2.5 '+o.v.P2);if(o.v.P1!=null)b.push('PM10 '+o.v.P1);if(o.v.temperature!=null)b.push(o.v.temperature+' °C');if(o.v.humidity!=null)b.push(o.v.humidity+'% RH');
    if(o.v.pressure!=null){var hpa=o.v.pressure/100;b.push(r1(hpa,0)+' hPa');if(hpa<850||hpa>1100){b.push('(implausible)');odd++}}
    return {t:o.km.toFixed(1)+' km',x:b.join(' · ')+' · '+ago(o.ts.replace(' ','T')+'Z')}});
  return {headline:list.length?list.length+' citizen sensors within 15 km':'No sensors within 15 km',rows:list.length?[['Nearest',list[0].km.toFixed(1)+' km away']]:[],items:items,itemsTitle:'Nearest first',flag:odd?odd+' reading(s) look wrong (impossible pressure). Needs sanity filters.':''}};
R['ea-floods']=function(t){var d=J(t),i=d.items||[];
  return i.length?{headline:i.length+' flood warning(s) or alert(s) nearby',items:i.map(function(x){return {t:x.severity||'',x:x.description||x.eaAreaName||''}})}:{headline:'No active flood warnings within 20 km',rows:[['Meaning','All clear right now']]}};
R['ea-tide']=function(t){var d=J(t),i=d.items||[];return {headline:i.length+' tide gauges in the sample',items:i.slice(0,6).map(function(x){return {t:x.stationReference,x:x.label}})}};
R['noaa-tides']=function(t){var d=J(t),r=d.data[0];return {headline:d.metadata.name+': '+r.v+' m',rows:[['Reading time (UTC)',r.t],['Station',d.metadata.id]],flag:'San Francisco example, not near you.'}};
R['ci-nat']=function(t){var x=J(t).data[0],i=x.intensity;return {headline:(i.actual||i.forecast)+' gCO₂/kWh, '+i.index,rows:[['Half hour',clock(x.from)+' to '+clock(x.to).split(', ').pop()],['Forecast',i.forecast],['Actual',i.actual==null?'not yet':i.actual]]}};
R['ci-reg']=function(t){var d=J(t).data[0],x=d.data[0],i=x.intensity;return {headline:i.forecast+' gCO₂/kWh, '+i.index+' ('+d.shortname+')',rows:[['Region',d.dnoregion],['Postcode area',d.postcode],['Half hour',clock(x.from)]],items:x.generationmix.filter(function(g){return g.perc>0}).sort(function(a,b){return b.perc-a.perc}).slice(0,5).map(function(g){return {t:g.perc+'%',x:g.fuel}}),itemsTitle:'Generation mix',flag:'A regional forecast, not a measurement at your postcode.'}};
R['ci-gen']=function(t){var d=J(t).data;return {headline:'Top source: '+d.generationmix.slice().sort(function(a,b){return b.perc-a.perc})[0].fuel,items:d.generationmix.filter(function(g){return g.perc>0}).sort(function(a,b){return b.perc-a.perc}).map(function(g){return {t:g.perc+'%',x:g.fuel}}),itemsTitle:'Share of GB generation now'}};
R['elexon']=function(t){var d=J(t),a=d.data||d,l=a[a.length-1],tot=l.data.reduce(function(s,x){return s+x.generation},0);
  return {headline:r1(tot/1000,1)+' GW generating',rows:[['Settlement period',l.settlementPeriod+' at '+clock(l.startTime)]],items:l.data.filter(function(x){return x.generation>0}).sort(function(a,b){return b.generation-a.generation}).slice(0,6).map(function(x){return {t:r1(x.generation/1000,1)+' GW',x:x.fuelType}}),itemsTitle:'By fuel'}};
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
R['wiki-geo']=function(t){var d=J(t).query.geosearch;return {headline:d.length+' articles within 2 km. Closest: '+(d[0]&&d[0].title),items:d.slice(0,8).map(function(x){return {t:Math.round(x.dist)+' m',x:x.title}})}};
R['commons']=function(t){var d=J(t).query.geosearch;return {headline:d.length+' freely licensed photos nearby',items:d.slice(0,6).map(function(x){return {t:Math.round(x.dist)+' m',x:x.title.replace('File:','')}})}};
R['fsa']=function(t){var d=J(t),e=d.establishments||[];return {headline:e.length+' food businesses within 1 mile. Closest: '+(e[0]&&e[0].BusinessName.replace(/\\&/g,'&')),items:e.slice(0,8).map(function(x){return {t:'rated '+x.RatingValue,x:x.BusinessName.replace(/\\&/g,'&')+' ('+x.BusinessType+', '+(x.Distance*1609|0)+' m)'}}),itemsTitle:'Nearest first'}};
R['planning']=function(t){var d=J(t);return d.count?{headline:d.count+' planning constraints here',items:d.entities.slice(0,5).map(function(x){return {t:x.dataset,x:x.name||x.reference||''}})}:{headline:'No conservation area at this exact point',flag:'An empty answer is normal when the point is not inside one.'}};
R['police']=function(t){var d=J(t),by={};d.forEach(function(c){by[c.category]=(by[c.category]||0)+1});var m=d[0]&&d[0].month;
  return {headline:d.length+' crimes reported within a mile in '+m,rows:[['Month covered',m],['Freshness','About 2 months behind']],items:Object.keys(by).sort(function(a,b){return by[b]-by[a]}).slice(0,6).map(function(k){return {t:by[k],x:k.replace(/-/g,' ')}}),itemsTitle:'By category',flag:'Monthly data with locations deliberately blurred. Not live.'}};
R['police-nh']=function(t){var d=J(t);return {headline:'Neighbourhood '+d.neighbourhood+', '+d.force.replace(/-/g,' ')}};
R['fixmystreet']=function(t){var i=rss(t);return {headline:i.length+' recent reports nearby, newest '+(i[0]?ago(i[0].date):'n/a'),items:i.slice(0,8).map(function(x){return {t:clock(x.date),x:trunc(x.title,90)}}),itemsTitle:'Latest first'}};
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
R['swpc-kp']=function(t){var d=J(t).filter(function(r){return Array.isArray(r)?r[0]!=='time_tag':true}).map(function(r){return Array.isArray(r)?{time:r[0],kp:r[1]}:{time:r.time_tag,kp:r.Kp!=null?r.Kp:r.kp_index}});var l=d[d.length-1];
  return {headline:'Kp index '+l.kp+' at '+String(l.time).slice(11,16)+' UTC',rows:[['Meaning',+l.kp>=5?'Storm conditions, aurora possible':'Quiet to unsettled']],items:d.slice(-5).map(function(r){return {t:String(r.time).slice(11,16),x:'Kp '+r.kp}})}};
R['swpc-oval']=function(t){var d=J(t);return {headline:'Aurora forecast grid, '+(d.coordinates||[]).length+' points',rows:[['Observation time',d['Observation Time']],['Forecast time',d['Forecast Time']]],flag:'Large file; needs processing to be useful.'}};
R['iss']=function(t){var d=J(t);return {headline:'ISS over '+r1(d.latitude,1)+', '+r1(d.longitude,1),rows:[['Altitude',r1(d.altitude,0)+' km'],['Speed',r1(d.velocity,0)+' km/h'],['Visibility',d.visibility],['Updated',ago(d.timestamp)]]}};
R['sunapi']=function(t){var r=J(t).results;return {headline:'Sunrise '+clock(r.sunrise).split(', ').pop()+', sunset '+clock(r.sunset).split(', ').pop(),rows:[['Day length',Math.round(r.day_length/60)+' min']]}};
R['inat']=function(t){var d=J(t);return {headline:d.total_results+' wildlife sightings within 3 km. Newest '+(d.results[0]?d.results[0].observed_on:''),items:d.results.slice(0,8).map(function(o){var tx=o.taxon||{};return {t:o.observed_on,x:(tx.preferred_common_name||tx.name||o.species_guess||'Unidentified')+' · '+trunc(o.place_guess||'',50)}}),itemsTitle:'Latest first'}};
R['gbif']=function(t){var d=J(t);return {headline:d.count+' archived species records nearby',items:d.results.slice(0,6).map(function(o){return {t:(o.eventDate||'').slice(0,10),x:o.species||o.scientificName}})}};
R['bankhol']=function(t){var e=J(t)['england-and-wales'].events.filter(function(x){return x.date>=new Date().toISOString().slice(0,10)});return {headline:e[0]?'Next: '+e[0].title+', '+e[0].date:'No upcoming holidays listed',items:e.slice(0,4).map(function(x){return {t:x.date,x:x.title+(x.notes?' ('+x.notes+')':'')}})}};
R['nager']=function(t){var d=J(t);return {headline:'Next: '+d[0].localName+', '+d[0].date,items:d.slice(0,4).map(function(x){return {t:x.date,x:x.localName}})}};
R['ukair-sos']=function(t){var d=J(t);return {headline:'Returned '+d.length+' stations from the national list',items:d.slice(0,5).map(function(x){return {t:'',x:x.properties.label}}),flag:'No distance filter in this call; you would filter by location yourself.'}};
R['usgs-water']=function(t){var d=J(t),s=(d.value&&d.value.timeSeries)||[];return {headline:s.length+' US river gauges in the box',items:s.slice(0,5).map(function(x){return {t:'',x:x.sourceInfo.siteName}}),flag:'US only.'}};
R['overpass']=function(t){var d=J(t),e=d.elements||[];return {headline:e.length+' mapped places within 400 m',items:e.slice(0,10).map(function(x){var g=x.tags||{};return {t:g.amenity||'',x:g.name||'(unnamed)'+(g.opening_hours?' · '+g.opening_hours:'')}}),itemsTitle:'Nearby amenities'}};

/* Multi-step renderers: fetch stations, then each nearest gauge's latest reading. */
function nearestStations(d,c,n){return (d.items||[]).map(function(s){return {ref:s.stationReference,label:s.label,river:s.riverName,km:hav(lat0(c),lon0(c),s.lat,s.long)}}).sort(function(a,b){return a.km-b.km}).slice(0,n)}
var RUN={};
RUN['ea-levels']=function(c,get,first){var d=J(first.text),near=nearestStations(d,c,4);
  return Promise.all(near.map(function(s){return get('https://environment.data.gov.uk/flood-monitoring/id/stations/'+s.ref+'/readings?latest').then(function(r){return {s:s,items:J(r.text).items||[]}},function(){return {s:s,items:[]}})})).then(function(res){
    function sum(it){var o=[];it.forEach(function(r){var m=r.measure||'',v=r.value;if(/flow/.test(m))o.push('flow '+v+' m³/s');else if(/downstage/.test(m))o.push('downstream '+v+' m');else if(/stage|level/.test(m))o.push('level '+v+' m')});return o.join(' · ')}
    var top=res[0],t0=top.items[0]&&top.items[0].dateTime;
    return {headline:top.s.label+' ('+top.s.river+'): '+(sum(top.items)||'no reading'),rows:[['Reading time',t0?clock(t0)+' ('+ago(t0)+')':'n/a'],['Gauges within 10 km',(d.items||[]).length],['Nearest',top.s.km.toFixed(1)+' km away']],
      items:res.map(function(x){return {t:x.s.km.toFixed(1)+' km',x:x.s.label+': '+(sum(x.items)||'no reading')}}),itemsTitle:'Nearest gauges, latest reading',flag:'Readings are every 15 minutes, but some sites upload only a few times a day.'}})};
RUN['ea-rain']=function(c,get,first){var d=J(first.text),near=nearestStations(d,c,3);
  return Promise.all(near.map(function(s){return get('https://environment.data.gov.uk/flood-monitoring/id/stations/'+s.ref+'/readings?latest').then(function(r){return {s:s,items:J(r.text).items||[]}},function(){return {s:s,items:[]}})})).then(function(res){
    var top=res[0],r0=top.items[0];
    return {headline:r0?r0.value+' mm in the last 15 minutes at the nearest gauge':'No reading at the nearest gauge',rows:[['Reading time',r0?clock(r0.dateTime)+' ('+ago(r0.dateTime)+')':'n/a'],['Gauges within 15 km',(d.items||[]).length],['Nearest',top.s.km.toFixed(1)+' km away']],
      items:res.map(function(x){var q=x.items[0];return {t:x.s.km.toFixed(1)+' km',x:q?q.value+' mm at '+clock(q.dateTime):'no reading'}}),itemsTitle:'Nearest gauges',flag:'Gauge names are all just “Rainfall station”; positions are snapped to a grid.'}})};

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
  'ea-levels':{run:'ea-levels'},'ea-rain':{run:'ea-rain'},
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
var results={},F={cat:'all',q:''};
var TESTABLE=SRC.filter(function(s){return s.u});
function valid(){var a=parseFloat(ctx.lat),b=parseFloat(ctx.lon);return isFinite(a)&&isFinite(b)&&Math.abs(a)<=90&&Math.abs(b)<=180}
function urlFor(s){if(!valid())return null;try{return s.u(ctx)}catch(e){return null}}

function get(url,opts){opts=opts||{};var t0=performance.now(),ac=new AbortController(),to=setTimeout(function(){ac.abort()},25000);
  return fetch(url,{headers:opts.headers||{},signal:ac.signal,cache:'no-store'}).then(function(r){return r.text().then(function(text){clearTimeout(to);
    var ms=Math.round(performance.now()-t0);
    if(!r.ok){var e=new Error('HTTP '+r.status+' '+trunc(strip(text),140));e.status=r.status;e.ms=ms;e.raw=text;throw e}
    return {status:r.status,text:text,ms:ms}})},function(err){clearTimeout(to);
    var e=new Error(err&&err.name==='AbortError'?'Timed out after 25 seconds.':'The browser blocked this call, or you are offline. That is usually a missing CORS header, so this feed needs a proxy.');e.blocked=true;e.ms=Math.round(performance.now()-t0);throw e})}

function load(id){var s=SRC.filter(function(x){return x.id===id})[0],url=urlFor(s);if(!url)return Promise.resolve();
  results[id]={state:'loading'};paint(id);var t0=performance.now();
  return get(url,{headers:s.headers}).then(function(r){
    var p=s.run?RUN[s.run](ctx,function(u){return get(u)},r):Promise.resolve((R[id]||generic)(r.text,ctx,s));
    return Promise.resolve(p).then(function(pv){results[id]={state:'ok',ms:Math.round(performance.now()-t0),pv:pv,raw:r.text,at:Date.now(),status:r.status}})
  }).catch(function(e){results[id]={state:'err',ms:e.ms||Math.round(performance.now()-t0),msg:e.message,blocked:!!e.blocked,status:e.status,raw:e.raw,at:Date.now(),soft:!!e.soft}}).then(function(){paint(id);summary()})}

function generic(t){var d;try{d=J(t)}catch(e){var it=rss(t);if(it.length)return {headline:it.length+' feed items',items:it.slice(0,6).map(function(x){return {t:clock(x.date),x:trunc(x.title,100)}})};return {headline:'Text response, '+t.length+' characters',rows:[['Start',trunc(strip(t),200)]]}}
  if(Array.isArray(d))return {headline:d.length+' items',rows:d[0]&&typeof d[0]==='object'?Object.keys(d[0]).slice(0,6).map(function(k){return [k,trunc(JSON.stringify(d[0][k]),80)]}):[]};
  return {headline:'JSON object with '+Object.keys(d).length+' fields',rows:Object.keys(d).slice(0,8).map(function(k){return [k,trunc(JSON.stringify(d[k]),80)]})}}

/* ---------- drawing ---------- */
function pvHTML(pv){var h='<p class="head">'+esc(pv.headline||'')+'</p>';
  if(pv.rows&&pv.rows.length)h+='<dl class="kv">'+pv.rows.map(function(r){return '<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>'}).join('')+'</dl>';
  if(pv.items&&pv.items.length)h+=(pv.itemsTitle?'<p class="it">'+esc(pv.itemsTitle)+'</p>':'')+'<ul class="items">'+pv.items.map(function(i){return '<li>'+(i.t!==''&&i.t!=null?'<b>'+esc(i.t)+'</b>':'')+'<span>'+esc(i.x)+'</span></li>'}).join('')+'</ul>';
  if(pv.flag)h+='<p class="flag">'+esc(pv.flag)+'</p>';return h}
function card(s){var url=urlFor(s);
  return '<article class="card" id="c-'+s.id+'"><div class="top"><h3>'+esc(s.name)+'</h3><span class="scope">'+esc(s.scope)+'</span></div>'
   +'<p class="desc">'+esc(s.desc)+'</p>'
   +(s.hint?'<p class="hint">'+esc(s.hint)+'</p>':'')
   +'<div class="acts"><button class="btn primary" data-load="'+s.id+'">Load live data</button>'+(url?'<a class="btn" href="'+esc(url)+'" target="_blank" rel="noopener">Raw ↗</a>':'')+'</div>'
   +'<div class="res" aria-live="polite"></div>'
   +'<div class="verdict" role="group" aria-label="Your verdict"><button data-v="keep">Keep</button><button data-v="maybe">Maybe</button><button data-v="scrap">Scrap</button></div>'
   +'</article>'}
function paint(id){var el=document.getElementById('c-'+id);if(!el)return;var r=results[id],box=el.querySelector('.res');
  el.querySelectorAll('.verdict button').forEach(function(b){b.setAttribute('aria-pressed',verdicts[id]===b.dataset.v?'true':'false')});
  var lb=el.querySelector('[data-load]');
  if(!r){box.innerHTML='';lb.textContent='Load live data';return}
  if(r.state==='loading'){box.innerHTML='<p class="st wait">Loading…</p>';lb.textContent='Loading…';return}
  lb.textContent='Reload';
  if(r.state==='err'){box.innerHTML='<p class="st bad">'+(r.soft?'Responded, but the data is not usable: ':'Failed: ')+esc(r.msg)+' <span class="ms">'+(r.ms?r.ms+' ms':'')+'</span></p>'+(r.raw?'<details class="raw"><summary>Raw response</summary><pre>'+esc(trunc(r.raw,1500))+'</pre></details>':'');return}
  box.innerHTML='<p class="st ok">Works in this browser <span class="ms">'+r.ms+' ms</span></p><div class="pv">'+pvHTML(r.pv)+'</div><details class="raw"><summary>Raw response</summary><pre>'+esc(trunc(r.raw,2500))+'</pre></details>'}
function renderList(){var q=F.q.toLowerCase(),html='';
  CATS.forEach(function(c){if(F.cat!=='all'&&F.cat!==c.id)return;var items=TESTABLE.filter(function(s){return s.cat===c.id&&(!q||(s.name+' '+s.desc).toLowerCase().indexOf(q)>=0)});if(!items.length)return;
    html+='<section class="group"><h2>'+esc(c.name)+'<span class="count">'+items.length+'</span></h2>'+items.map(card).join('')+'</section>'});
  $('#list').innerHTML=html||'<p class="empty">No sources match.</p>';TESTABLE.forEach(function(s){paint(s.id)})}
function summary(){var ok=0,bad=0,blocked=0;Object.keys(results).forEach(function(k){var r=results[k];if(r.state==='ok')ok++;else if(r.state==='err'){bad++;if(r.blocked)blocked++}});
  $('#sum').textContent=Object.keys(results).length?ok+' working · '+bad+' failed'+(blocked?' ('+blocked+' blocked by the browser)':''):'Nothing loaded yet'}

/* ---------- controls ---------- */
function setCtx(c){ctx=c;lsSet('hlx-ctx',JSON.stringify(ctx));syncFields();results={};renderList();summary()}
function syncFields(){$('#f-place').value=ctx.place||'';$('#f-pc').value=ctx.pc||'';$('#f-lat').value=ctx.lat||'';$('#f-lon').value=ctx.lon||'';
  document.querySelectorAll('[data-preset]').forEach(function(b){var p=PRESETS.filter(function(x){return x.n===b.dataset.preset})[0];b.setAttribute('aria-pressed',p&&p.lat===ctx.lat&&p.lon===ctx.lon?'true':'false')})}
var lt;['#f-place','#f-pc','#f-lat','#f-lon'].forEach(function(s){$(s).addEventListener('input',function(){clearTimeout(lt);lt=setTimeout(function(){setCtx({place:$('#f-place').value.trim(),pc:$('#f-pc').value.trim().toUpperCase(),lat:$('#f-lat').value.trim(),lon:$('#f-lon').value.trim()})},500)})});
$('#geo').addEventListener('click',function(){var m=$('#geomsg');if(!navigator.geolocation){m.textContent='This browser has no location access.';return}
  m.textContent='Asking for your location…';
  navigator.geolocation.getCurrentPosition(function(p){var c={place:ctx.place,pc:'',lat:p.coords.latitude.toFixed(4),lon:p.coords.longitude.toFixed(4)};m.textContent='Got it. Looking up the place name…';setCtx(c);
    get('https://nominatim.openstreetmap.org/reverse?lat='+c.lat+'&lon='+c.lon+'&format=jsonv2&zoom=14').then(function(r){var a=J(r.text).address||{};c.place=a.suburb||a.village||a.town||a.city||c.place;c.pc=((a.postcode||'').split(' ')[0]||'').toUpperCase();setCtx(c);m.textContent='Location set to '+c.place+'.'},function(){m.textContent='Location set. Enter a place name above.'})},
    function(e){m.textContent='Location was refused or unavailable ('+(e&&e.message||'error')+'). Type coordinates instead.'},{enableHighAccuracy:false,timeout:15000})});
document.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;
  if(t.dataset.preset){var p=PRESETS.filter(function(x){return x.n===t.dataset.preset})[0];setCtx({place:p.n,lat:p.lat,lon:p.lon,pc:p.pc});return}
  if(t.dataset.cat){F.cat=t.dataset.cat;document.querySelectorAll('[data-cat]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.cat===F.cat?'true':'false')});renderList();return}
  if(t.dataset.load){load(t.dataset.load);return}
  if(t.dataset.v){var id=t.closest('.card').id.slice(2);if(verdicts[id]===t.dataset.v)delete verdicts[id];else verdicts[id]=t.dataset.v;lsSet('hlx-v',JSON.stringify(verdicts));paint(id);return}
});
$('#q').addEventListener('input',function(e){F.q=e.target.value.trim();renderList()});
var running=false;
$('#all').addEventListener('click',function(){if(running)return;running=true;var b=$('#all');b.disabled=true;
  var q=TESTABLE.filter(function(s){return !s.heavy&&(F.cat==='all'||s.cat===F.cat)}).map(function(s){return s.id}),n=0,tot=q.length;
  function next(){var id=q.shift();if(!id)return Promise.resolve();return load(id).then(function(){n++;b.textContent='Loading '+n+' of '+tot+'…'}).then(next)}
  Promise.all([next(),next(),next(),next()]).then(function(){running=false;b.disabled=false;b.textContent='Load all again'})});
$('#copy').addEventListener('click',function(){var rep=TESTABLE.filter(function(s){return results[s.id]||verdicts[s.id]}).map(function(s){var r=results[s.id]||{};return {id:s.id,name:s.name,verdict:verdicts[s.id]||null,works:r.state==='ok'?true:(r.state==='err'?false:null),ms:r.ms||null,blocked:r.blocked||undefined,error:r.state==='err'?r.msg:undefined,headline:r.pv&&r.pv.headline||undefined}});
  var out={place:ctx.place,lat:ctx.lat,lon:ctx.lon,when:new Date().toISOString(),ua:navigator.userAgent,results:rep},txt=JSON.stringify(out,null,1),ta=$('#report');ta.value=txt;ta.hidden=false;
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){$('#copymsg').textContent='Copied. Paste it into the chat.'},function(){ta.select();$('#copymsg').textContent='Select all and copy, then paste it into the chat.'})});

/* boot */
$('#cats').innerHTML=[{id:'all',name:'All'}].concat(CATS.filter(function(c){return TESTABLE.some(function(s){return s.cat===c.id})})).map(function(c){return '<button class="chip" data-cat="'+c.id+'" aria-pressed="'+(c.id==='all')+'">'+esc(c.name)+'</button>'}).join('');
$('#presets').innerHTML=PRESETS.map(function(p){return '<button class="chip" data-preset="'+esc(p.n)+'" aria-pressed="false">'+esc(p.n)+'</button>'}).join('');
$('#nt').innerHTML=NOT_TESTABLE.map(function(s){return '<li><b>'+esc(s.name)+'</b> <span>'+esc(s.scope)+' · '+esc({key:'needs a key',oauth:'needs a login',paid:'paid or limited',closed:'closed',unknown:'no known endpoint',open:'no direct call yet'}[s.auth]||'')+'</span><br>'+esc(s.note||s.desc)+'</li>'}).join('');
syncFields();renderList();summary();
})()}
if(typeof module!=='undefined')module.exports={SRC:SRC,R:R,RUN:RUN,CATS:CATS,TESTABLE:SRC.filter(function(s){return s.u})};
