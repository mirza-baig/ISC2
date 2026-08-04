# escape=`

#
# Development-only image for running Next.js in a containerized environment.
# Assumes that the Next.js rendering host source is mounted to c:\app.
#

ARG PARENT_IMAGE
FROM ${PARENT_IMAGE} as debug

WORKDIR /frontend

# Make port 3000 available to the world outside this container

ENV NODE_OPTIONS=--max-old-space-size=8192
EXPOSE 3000
ENTRYPOINT "npm install && npm run start:connected"