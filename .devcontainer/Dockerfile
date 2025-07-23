ARG VARIANT="22"
FROM mcr.microsoft.com/devcontainers/javascript-node:1-${VARIANT}

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends bundler git unzip gzip xz-utils


USER ${containerUser}
COPY . .

# Install Proto & Moon
ENV PROTO_HOME="/home/${containerUser}/.proto"
RUN curl -fsSL https://moonrepo.dev/install/proto.sh | bash -s -- --yes
ENV PATH="$PROTO_HOME/shims:$PROTO_HOME/bin:$PATH"

RUN ./home/${containerUser}/.proto/bin/proto use

RUN npm install