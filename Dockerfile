# --- Build stage -------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Build-time configuration (Vite inlines these into the bundle)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

COPY package.json package-lock.json* ./
# react-day-picker 8 declares date-fns <4 as a peer; the project uses date-fns 4,
# which works in practice but makes a strict `npm ci` refuse to install.
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# --- Serve stage -------------------------------------------------------------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
