# ISC2 Sitecore 10.3, NextJS, SXA Repository

## XMC Todo
Add documentation for XM Cloud - Please post that in this Readme file, as well as in this confluence page:
https://iscsquared.atlassian.net/wiki/spaces/XMC/pages/4130766913/XM+Cloud+Upgrade

## Code Access
Once code access is received, please set up two way authentication in bitbucket.
* Login to your account and go to bitbucket settings.
* Under security tab there is an option to enable Two-step verification. Please set that up.

## Technical Information

* .NET Target Version: 4.8
* XM Cloud Version: 10.3-ltsc2019
* Node Version: 20.11.0+
  * JSS Version: ~22.1.1
  * Next.js Version: ^14.1.0

### Local Setup

#### Install all prerequisite
* Windows Powershell 5+
* [Node 20.11.0](https://nodejs.org/download/release/v20.11.1/)
* Node.js current LTS version
* Container mode - (Backend Only)
  * 32+ GB of available memory
  * 40+ GB of available disk space
  * Valid Sitecore license
  * Visual Studio 2022
  * Windows 10+ (build 1909 or greater)
  * [Hyper-V must be enabled](https://techcommunity.microsoft.com/t5/educator-developer-blog/step-by-step-enabling-hyper-v-for-use-on-windows-11/ba-p/3745905)
  * [Docker Desktop 4.29.0+](https://docs.docker.com/desktop/install/windows-install/)
    * Check setting: _Use WSL 2 based engine_
    * Ensure Windows containers are enabled 
	* .NET Core SDK
	* .NET Framework SDK


**Important**: If you already have an ISC2 workspace set up, please, create a new one to work with the XM Cloud solution.

### QUICK START - Docker Mode - Backend

```
If IIS is enabled in the system then please stop IIS services. Command: net stop "W3SVC"
Make sure docker is running in windows container.
Make sure the ports used by docker containers are available. Services: SOLR, MSSQL.
```

* In an ADMIN terminal, find the root of the solution
  > Example:  `cd C:\src\git\isc2`

* Go to the Head application folder
    
    ```ps1
    cd .\src\Front
    ```

* Install packages
    
    ```ps1
    npm install
    ```
    
* Access the Head application through Windows Explorer and create a new .env file (File Name: .env.local).
  * The .env.local file must have the following variables.:
    * PUBLIC_URL
    * JSS_EDITING_SECRET
    * SITECORE_API_KEY
    * SITECORE_API_HOST
    * GRAPH_QL_ENDPOINT

* Go back to the root of the solution
* Execute `init.ps1` script (Run it just once - initial setup):

    ```ps1
    .\init.ps1 -InitEnv -LicenseXmlPath "C:\path\to\license.xml" -AdminPassword "DesiredAdminPassword" -ValtechHelixName "ValtechHelixName"
    ```
    > Example: ``` .\init.ps1 -LicenseXmlPath "FULLPATH OF license.xml" -AdminPassword "b" -ValtechHelixName "ValtechHelix" ```

* Restart your terminal and execute `up.ps1` script (Run it when docker files are changed):

    ```ps1
    .\up.ps1
    ```

* Open the sitecore instance and install the Site content

* Open `www.isc2.localhost` in your browser.


### QUICK START - Connected Mode - Frontend

* In an ADMIN terminal, find the root of the solution
  > Example:  `cd C:\src\git\isc2`

* Go to the Head application folder
    
    ```ps1
    cd .\src\Front
    ```

* Install packages
    
    ```ps1
    npm install
    ```

* Access the Head application through Windows Explorer and create a new .env file (File Name: .env.local) to pull content from an external environment.
  * The .env.local file must have the following variables.:
    * PUBLIC_URL
    * JSS_EDITING_SECRET
    * SITECORE_API_KEY
    * SITECORE_API_HOST
    * SITECORE_ENVIRONMENT
    * GRAPH_QL_ENDPOINT
    * SITECORE_EDGE_CONTEXT_ID
   
    > Note: You can find their values on the Sitecore Portal by choosing the environment you would like to pull content from. Url: https://deploy.sitecorecloud.io/projects?organization=org_trY1Dm868sH42gTC.

* Build Head application: 
    
    ```ps1
    npm run build
    ```

* Run Head application in connected mode:
    
    ```ps1
    npm run start:connected
    ```   
    
* Open `localhost:3000` in your browser.

### Additional commands

* Quick Startup:

    ```ps1
    .\up.ps1 -SkipPortCheck -SkipIndexing -SkipPush -SkipBuild
    ```
  

#### Troubleshoot
1. If Experience editor and rendering site are not working, please, verify rendering container in docker. Make sure its in up state.
2. If Frontend build is not working, please, make sure you are working on a brand new workspace to avoid any kind of file from the old solution.
3. If you get the error `a Windows version 10.0.20348-based image is incompatible with a x.x.xxxxx host`, it means your Windows version is lower than the images' ones. To solve that, open `.valtechhelix` file in the repo root and change the following images variables' values to match your Windows version:

    ```ps1
    SITECORE_VERSION=1-ltsc2022
    EXTERNAL_IMAGE_TAG_SUFFIX=ltsc2022
    TRAEFIK_IMAGE=traefik:v2.11.2-windowsservercore-ltsc2022
    NODEJS_PARENT_IMAGE=mcr.microsoft.com/windows/nanoserver:ltsc2022
    ```   
    
    For example, if your Windows 10 version is `20H2` in an AMD64 architecture, you should use: 

    ```ps1
    SITECORE_VERSION=1-ltsc2019
    EXTERNAL_IMAGE_TAG_SUFFIX=ltsc2019
    TRAEFIK_IMAGE=traefik:v2.11.2-windowsservercore-1809
    NODEJS_PARENT_IMAGE=mcr.microsoft.com/windows/nanoserver:20H2-amd64
    ```   
    
4. When running the `init.ps1` described above, NEVER run it with less parameters than the above specified! If you do so, you're may get the error `Cannot bind argument to parameter 'Path' because it is null` when `up.ps1` runs the `Validate-LicenseExpiry` command.