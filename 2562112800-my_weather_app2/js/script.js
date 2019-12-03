$(document).ready(() => {
  const $refreshBtn = $('#refresh-btn');
  const $stationList = $('#stations-list');

  const createUrl = (baseUrl, params = {}) =>
    `${baseUrl}?${Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&')}`;

  const distance = (lat1, lng1, lat2, lng2) => Math.sqrt(
    Math.pow(lat1 - lat2, 2) +
    Math.pow(lng1 - lng2, 2)
  );

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

  const getWeatherData = (lat, lng, limit = null) => new Promise((resolve, reject) => {
    const requestSuccess = response => {
      if (response.stations) {
        const headers = response.stations.columns.map(x => x.toLowerCase());
        const data = [];

        $.each(response.stations.records, (rowIdx, record) => {
          const station = {};
          $.each(record, (colIdx, cell) => {
            station[headers[colIdx]] = cell;
          });
          station.distance = distance(lat, lng, parseFloat(station.latitud), parseFloat(station.longitud));
          data.push(station);
        });

        data.sort((a, b) => a.distance - b.distance);

        if (limit) {
          data.splice(limit);
        }

        resolve(data);
      } else {
        reject('No stations data');
      }
    };

    const requestFailed = response => {
      reject(response);
    };

    const requestUrl = createUrl('http://pixel.uji.es/meteo/api/api.php/stations');

    $.ajax({
      url: requestUrl,
      success: requestSuccess,
      error: requestFailed
    });
  });

  const createListItem = station => $(`<li><a href="#">${station.name}`
    + `<span class="ui-li-count">${Math.round(station.t)}℃</span></a></li>`);

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
      const stations = await getWeatherData(location.lat, location.lng, 30);
      populateView(stations);
    } catch (error) {
      console.error(error);
    }
  };

  $refreshBtn.bind('click', refreshHandler);
});
