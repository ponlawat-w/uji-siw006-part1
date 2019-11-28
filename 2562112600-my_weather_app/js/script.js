$(document).ready(() => {
  const $refreshBtn = $('#refresh-btn');
  const $stationList = $('#stations-list');

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

  const createListItem = station => $(`<li><a href="#">${station.name}`
    + `<span class="ui-li-count">${Math.round(station.main.temp)}℃</span></a></li>`);

  const populateView = stations => {
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
      const location = await getLocation();
      const weatherData = await getWeatherData(location.lat, location.lng);
      populateView(weatherData.list);
    } catch (error) {
      console.error(error);
    }
  };

  $refreshBtn.bind('click', refreshHandler);
});
