export default async function({ rootUrl, projectId }) {
  let url = `${rootUrl}xapi/viewerConfig/projects/${projectId}`;

  return fetchViewerSettings(url)
    .then(result => {
      const { status, response } = result;
      if (status === 200 && response) {
        console.log(`Viewer settings (Project) = ${JSON.stringify(response)}`);
        return response;
      }
    })
    .catch(error => {
      console.log(`Error while retrieving viewer settings: ${error}`);
    });
}

function fetchViewerSettings(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr);
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.send();
  });
}
