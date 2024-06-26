<p align="center">
  <img src="https://img.shields.io/github/checks-status/MDeLuise/plant-it/main?style=for-the-badge&label=build&color=%2228B22" width="120px" />
<img src="https://img.shields.io/github/v/release/MDeLuise/plant-it?style=for-the-badge&color=%2228B22" width="120px" />
</p>

<p align="center">
  <img width="150px" src="images/plant-it-logo.png" title="Plant-it">
</p>

<h1 align="center">Plant-it</h1>

<p align="center"><i><b>[Still under "initial" development, some features may be unstable or change in the future, although database schemas should be stable. A first release version is planned to be packed soon].</b></i></p>
<p align="center">Plant-it is a <b>self-hosted gardening companion app.</b><br>Useful for keeping track of plant care, receiving notifications about when to water plants, uploading plant images, and more.</p>

<p align="center"><a href="https://docs.plant-it.org">Explore the documentation</a></p>

<p align="center"><a href="https://github.com/MDeLuise/plant-it/#why">Why?</a> • <a href="https://github.com/MDeLuise/plant-it/#features-highlight">Features highlights</a> • <a href="https://github.com/MDeLuise/plant-it/#quickstart">Quickstart</a> • <a href="https://github.com/MDeLuise/plant-it/#contribute">Contribute</a></p>

<p align="center">
  <img src="/images/screenshot-1.png" width="45%" />
  <img src="/images/screenshot-2.png" width="45%" /> 
  <img src="/images/screenshot-3.png" width="45%" />
  <img src="/images/screenshot-4.png" width="45%" /> 
</p>

## Why?
Plant-it is a gardening companion app that helps you take care of your plants.

It does not recommend you about which action to take, instead it is designed to logs the activity you are doing.
This is on purpose, I strongly believe that the only one in charge of know when to water your plants, when to fertilize them, etc. is you (with the help of multiple online sources).

Plant-it helps you remember the last time you did a treatment of your plants, which plants you have, collects photos of your plants, and notify you about time passed since last action on them.


## Features highlight
* Add existing plants using [Trefle API](https://trefle.io/) or user created plants to your collection
* Log events like watering, fertilizing, biostimulating, etc. for your plants
* View all the logged events, filtering by plant and event type
* Upload photos of your plants
* Set reminder for some actions on your plants (e.g. notify if not watered every 4 days)

Take a look at the [roadmap](https://github.com/users/MDeLuise/projects/3/views/1) for a more detailed list of future features and enhancements.

## Quickstart 
Installing Plant-it is pretty straight forward, in order to do so follow these steps:

1. Create a folder where you want to place all Plant-it related files.
1. Inside that folder, create the following files:
    * `docker-compose.yml`:
    ```yaml
    version: "3"
    name: plant-it
    services:
      backend:
        image: msdeluise/plant-it-backend:latest
        env_file: backend.env
        depends_on:
          - db
          - cache
        restart: unless-stopped
        volumes:
          - "./upload-dir:/upload-dir"
          - "certs:/certificates"
        ports:
          - "8080:8080"

      db:
        image: mysql:8.0
        restart: always
        env_file: backend.env
        volumes:
          - "./db:/var/lib/mysql"

      cache:
        image: redis:7.2.1
        restart: always

      frontend:
        image: msdeluise/plant-it-frontend:latest
        env_file: frontend.env
        links:
          - backend
        ports:
          - "3000:3000"
        volumes:
          - "certs:/certificates"
    volumes:
      certs:
        driver: local
        driver_opts:
          type: none
          o: bind
          device: ./certificates
    ```
    * `backend.env`:
    ```properties
    #
    # DB
    #
    MYSQL_HOST=db
    MYSQL_PORT=3306
    MYSQL_USERNAME=root
    MYSQL_PSW=root
    MYSQL_ROOT_PASSWORD=root
    MYSQL_DATABASE=bootdb

    #
    # JWT
    #
    JWT_SECRET=putTheSecretHere
    JWT_EXP=1
    
    #
    # Server config
    #
    USERS_LIMIT=-1
    UPLOAD_DIR=/upload-dir
    API_PORT=8080
    TREFLE_KEY=
    ALLOWED_ORIGINS=*
    LOG_LEVEL=DEBUG
    UPDATE_EXISTING=false
    
    #
    # Cache
    #
    CACHE_TTL=86400
    CACHE_HOST=cache
    CACHE_PORT=6379

    #
    # SSL
    #
    SSL_ENABLED=false
    CERTIFICATE_PATH=/certificates/
    ```
    * `frontend.env`:
    ```properties
    PORT=3000
    API_URL=http://localhost:8080/api
    WAIT_TIMEOUT=10000
    CACHE_TTL_DAYS=7
    BROWSER=none
    SSL_ENABLED=false
    CERTIFICATE_PATH=/certificates/
    ```
1. Run the docker compose file (`docker compose -f docker-compose.yml up -d`), then the service will be available at `localhost:3000`, while the REST API will be available at `localhost:8080/api` (`localhost:8080/api/swagger-ui/index.html` for the documentation of them).

<a href="https://docs.plant-it.org/installation/configurations/">Take a look at the documentation</a> in order to understand the available configurations and let the service be available even from another machine.

## Contribute
Feel free to contribute and help improve the repo.

### Bug Report, Feature Request and Question
You can submit any of this in the [issues](https://github.com/MDeLuise/plant-it/issues/new/choose) section of the repository. Chose the right template and then fill the required info.

### Feature development
Let's discuss first possible solutions for the development before start working on that, please open a [feature request issue](https://github.com/MDeLuise/plant-it/issues/new?assignees=&labels=feature+request&projects=&template=feature_request.yml).

### How to contribute
If you want to make some changes and test them locally <a href="https://docs.plant-it.org/support/local-environment/">take a look at the documentation</a>.

## Support the project
If you find this project helpful and would like to supporting it, consider by [buying me a coffee](https://www.buymeacoffee.com/mdeluise). Your generosity helps keep this project alive and ensures its continued development and improvement.
