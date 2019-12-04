let stations = [];
let currentStation = null;

const createUrl = (baseUrl, params = {}) =>
  `${baseUrl}?${Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&')}`;

const getLocation = () => new Promise((resolve, reject) => {
  const requestSuccess = response => {
    resolve({
      lat: parseFloat(response.latitude),
      lng: parseFloat(response.longitude)
    });
  };

  const requestFailed = response => {
    reject(response);
  };

  const requestUrl = createUrl('https://api.ipgeolocation.io/ipgeo', {apiKey: IP_GEOLOCATION_API_KEY});

  $.ajax({
    url: requestUrl,
    method: 'GET',
    success: requestSuccess,
    error: requestFailed
  })
});

const getWeatherData = (lat, lng) => new Promise((resolve, reject) => {
  const requestSuccess = response => {
    resolve(response);
  };

  const requestFailed = response => {
    reject(response);
  };

  const requestUrl = createUrl('https://api.openweathermap.org/data/2.5/find', {
    lat: lat,
    lon: lng,
    appId: OPEN_WEATHER_MAP_API_KEY,
    units: 'metric',
    cnt: 20
  });

  $.ajax({
    url: requestUrl,
    success: requestSuccess,
    error: requestFailed
  });
});

const createListItem = station => $(`<li><a class="to-detail-link" data-id="${station.id}" href="#">${station.name}`
  + `<span class="ui-li-count">${Math.round(station.main.temp)}℃</span></a></li>`);

const populateView = () => {
  const $stationList = $('#stations-list');
  $stationList.find('li').remove();
  $.each(stations, (idx, station) => {
    $stationList.append(createListItem(station));
  });
  $stationList.listview('refresh');
};

const refreshHandler = async(e) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  try {
    $.mobile.loading('show');
    const location = await getLocation();
    const weatherData = await getWeatherData(location.lat, location.lng);
    stations = weatherData.list;
    populateView();
    $.mobile.loading('hide');
  } catch (error) {
    console.error(error);
    $.mobile.loading('hide');
  }
};

const toDetailHandler = e => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const dataId = $(e.target).attr('data-id');
  let station = stations.filter(s => s.id == dataId);
  station = station.length ? station[0] : null;

  if (station) {
    currentStation = station;
    $.mobile.changePage('station.html');
  }
};

$(document).on('pagebeforeshow', '#home', () => {
  $('#refresh-btn').bind('click', refreshHandler);
  $(document).on('click', '.to-detail-link', toDetailHandler);
});

$(document).on('pagebeforeshow', '#station', () => {
  let description = currentStation.weather[0].description
    .split(' ')
    .map(word => word ? `${word.charAt(0).toUpperCase()}${word.substring(1)}` : '')
    .join(' ');

  $('#station-icon').attr('src',
    `https://openweathermap.org/img/w/${currentStation.weather[0].icon}.png`);
  $('#station-name').html(currentStation.name);
  $('#station-description').html(description);
  $('#station-temperature').html(currentStation.main.temp);
  $('#station-humidity').html(currentStation.main.humidity);
  $('#station-pressure').html(Math.round(currentStation.main.pressure).toString());
});
