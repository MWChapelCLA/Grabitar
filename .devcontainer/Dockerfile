FROM mcr.microsoft.com/devcontainers/python:1-3.12-bullseye

# Fix the Yarn public key issue
# 1. Remove the problematic yarn list file to clear apt update blockers
# 2. Update apt and install necessary tools (curl, gnupg)
# 3. Fetch the new key and setup the list file correctly
RUN rm -f /etc/apt/sources.list.d/yarn.list \
    && apt-get update \
    && apt-get install -y curl gnupg \
    && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor > /usr/share/keyrings/yarn-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/yarn-archive-keyring.gpg] https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list



