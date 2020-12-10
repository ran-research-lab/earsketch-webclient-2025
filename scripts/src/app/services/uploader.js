/**
 * An angular factory that provides a service for uploading audio to the
 * EarSketch server.
 *
 * @module uploader
 * @author Creston Bunch
 */
app.factory('uploader', ['$http', function uploader($http) {

    /**
     * Uploads a blob object to the server so the user can download it there.
     *
     * @param {string} filename The filename to give it.
     * @param {Blob} blob The blob object to download as a file.
     * @param {Date} timestamp The timestamp of the download.
     * @returns {Promise} A promise that resolves to the HTTP response with the
     * URL and filename in the response data.
     */
    function uploadBlob(filename, blob, timestamp) {
        var url = URL_DOMAIN +'/services/files/download';
        var formData = new FormData();
        formData.append(
            'file',
            blob,
            filename
        );

        return $http({
                method: 'POST',
                url: url,
                data: formData,
                timeout: 60000,
                // don't let Angular transform our formData to JSON
                transformRequest: angular.identity,
                // let the browser automatically decide the content type
                headers: {'Content-Type': undefined}
            });
    }

    return {
        uploadBlob: uploadBlob
    }

}]);

