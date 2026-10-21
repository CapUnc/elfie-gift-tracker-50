# Christmas Gift Tracker

A collaborative household gift tracking application that helps families and groups organize and manage Christmas gift shopping. Track what gifts you're buying for each person, who's contributing to each gift, and monitor your budget—all in one place.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Application Flow](#application-flow)
- [Core Concepts](#core-concepts)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Component Structure](#component-structure)
- [Deployment](#deployment)

## Overview

Christmas Gift Tracker is a web application designed for households where multiple people need to coordinate gift-giving. Instead of confusion about who's buying what and for whom, everyone in the household can see the complete picture, assign gifts to themselves, track purchases, and collaborate on shared gifts.

## Key Features

### Household Management
- **Create or Join Households**: Users can create their own household or join an existing one using an invite code
- **Multi-user Collaboration**: All household members see the same gift lists and can collaborate in real-time
- **Household Settings**: Manage household name, currency, and members

### Gift Tracking
- **Recipient Management**: Create recipients (people you're buying gifts for)
- **Gift Items**: Add multiple gifts for each recipient with details like:
  - Gift name
  - Cost
  - Purchase URL
  - Tracking information
  - Purchase/wrapped status
- **Placeholder Gifts**: Add placeholder gifts when you know someone needs more gifts but haven't decided what yet
- **Gift Assignment**: Assign gifts to household members using an intuitive icon grid selector
- **Multi-giver Support**: Multiple people can contribute to the same gift (split costs)

### Organization Features
- **Alphabetical Index**: Quick navigation to recipients by first letter
- **Search**: Filter recipients and gifts by name
- **Filters**: Filter by giver (including "My gifts"), completion, wrapping status, and cost status
- **Completion Tracking**: Mark recipients as complete (manual or automatic based on gift status)
- **Notes System**: Add rich notes to recipients with optional links
- **Collapsible Cards**: Expandable recipient cards showing summary info when collapsed
- **Mobile-Optimized**: Click anywhere on a card to expand on mobile devices

### Status Management
- **Purchase Status**: Track if gifts have been purchased
- **Wrapped Status**: Track if gifts have been wrapped
- **Completion Status**: Automatically calculate recipient completion based on gift status

### Budget Tracking
- **Cost Tracking**: See individual gift costs and total spent per recipient
- **Summary View**: Dashboard showing total recipients, gifts, completion percentage, and total spent
- **Currency Support**: Configurable currency symbol per household

### User Experience
- **Swipeable Actions**: Swipe gifts to edit or delete (mobile-friendly)
- **Haptic Feedback**: Tactile feedback on mobile devices
- **Context Menus**: Right-click context menus for quick actions
- **Floating Action Button**: Quick access to add recipients
- **Toast Notifications**: User feedback for all actions
- **Dark Mode**: Full dark mode support

## Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons

### Backend (Lovable Cloud/Supabase)
- **Supabase** - Backend as a service
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data access control
- **Authentication** - Google OAuth

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## Getting Started

### Prerequisites
- Node.js & npm (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Google account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the local development URL (typically `http://localhost:5173`)

### First-Time Setup

1. **Sign In**: Click "Continue with Google" on the auth page
2. **Choose Path**: 
   - Create a new household if you're starting fresh
   - Join an existing household using an invite code
3. **Create Profile**: Enter household name, your display name, and choose an emoji
4. **Start Tracking**: Add recipients and their gifts

## Application Flow

### Authentication Flow
1. User lands on `/auth` page
2. Signs in with Google OAuth
3. Redirected to root `/`
4. If no household exists, redirected to `/welcome`
5. User creates or joins household
6. Redirected to main gift tracker

### Main User Flow
1. **Add Recipients**: Click the floating "+" button to add people you're buying gifts for
2. **Add Gifts**: Click on a recipient card, then "Add Gift" to add gift items
3. **Assign Givers**: Use the icon grid to select who's buying/contributing to each gift
4. **Track Progress**: Mark gifts as purchased/wrapped using checkboxes
5. **Add Notes**: Add helpful notes or links for each recipient
6. **Monitor Summary**: Check the summary tab for overall progress and budget

### Household Collaboration
1. **Generate Invite Code**: Settings → Household → Generate Invite Code
2. **Share Code**: Give the code to household members
3. **Join Household**: New users enter the code on the "Join Household" page
4. **Collaborate**: All members see the same data in real-time

## Core Concepts

### Households
A household is a group of people collaborating on gift tracking. All data is scoped to a household—members can only see gifts and recipients within their household.

### Recipients
People you're buying gifts for (e.g., "Mom", "Dad", "Sarah"). Recipients can have:
- Multiple gifts
- Notes with optional links
- Completion status (manual or automatic)

Givers are assigned at the **gift level only** — there is no recipient-level assignment. The collapsed recipient card shows aggregated giver icons (unique givers across all that person's gifts) and a notes badge.

### Gifts
Individual gift items for recipients. Each gift has:
- Name
- Cost (optional)
- URL (optional)
- Tracking info (optional)
- Purchase status (checkbox)
- Wrapped status (checkbox)
- One or more givers (who's buying it)
- Placeholder flag (for unknown gifts)

### Givers
Household members who can be assigned to gifts. Each giver has:
- Name
- Icon/emoji
- Optional link to a user profile (for authenticated users)
- Virtual flag (for non-users, e.g., "Kids' shared funds")

### Profiles
User accounts linked to a household. Contains:
- Display name
- Email
- Household association
- Linked giver record

## Architecture

### State Management
- **Custom hooks** (`useState`/`useEffect`): Server state fetching per domain (`useRecipients`, `useGifts`, `useGivers`, `useRecipientNotes`, `useHousehold`)
- **Supabase Realtime**: Each hook subscribes to Postgres changes on its table(s) (including `gift_givers`) and refetches on change, so all household members see live updates
- **React Query**: Provider is configured in `App.tsx` for future server-state caching
- **React Context/Hooks**: Local component state

### Data Flow
1. Components consume custom hooks scoped to the user's household
2. Hooks query Supabase directly and keep state fresh via realtime subscriptions
3. Supabase client handles API calls with RLS enforcing access control

### Error Handling
- **`ErrorBoundary`** wraps the entire app and shows a friendly fallback with a reload option if a render error occurs
- All hook mutations surface failures via toast notifications

### Security
- **Row Level Security (RLS)**: All database tables have RLS policies
- **Household Scoping**: Users can only access data from their household
- **Authentication Required**: All routes except `/auth` require authentication
- **Profile-based Access**: Access is determined by user's profile → household relationship

## Database Schema

### Tables

#### `households`
Represents a group collaborating on gift tracking.
- `id` (uuid, PK)
- `name` (text) - Household name
- `currency` (text) - Currency symbol (default: '$')
- `created_at` (timestamp)

#### `profiles`
User profiles linked to households.
- `id` (uuid, PK) - References auth.users
- `email` (text)
- `display_name` (text)
- `household_id` (uuid, FK → households)
- `created_at` (timestamp)

#### `givers`
People who can be assigned to gifts.
- `id` (uuid, PK)
- `household_id` (uuid, FK → households)
- `name` (text)
- `icon` (text) - Emoji
- `profile_id` (uuid, FK → profiles, nullable) - Links to user if authenticated
- `is_virtual` (boolean) - True for non-user givers
- `display_order` (integer)
- `created_at` (timestamp)

#### `recipients`
People receiving gifts.
- `id` (uuid, PK)
- `household_id` (uuid, FK → households)
- `name` (text)
- `notes` (text, deprecated - use recipient_notes table instead)
- `assigned_to` (uuid, FK → givers, nullable, **deprecated** — givers are assigned per-gift via `gift_givers`)
- `completed` (boolean) - Auto-calculated from gifts
- `manual_complete` (boolean) - User can override completion
- `created_at` (timestamp)

#### `gifts`
Individual gift items.
- `id` (uuid, PK)
- `recipient_id` (uuid, FK → recipients)
- `household_id` (uuid, FK → households)
- `name` (text)
- `cost` (numeric, nullable)
- `url` (text, nullable)
- `tracking` (text, nullable)
- `purchased` (boolean, default: false)
- `wrapped` (boolean, default: false)
- `assigned_to` (uuid, FK → givers, nullable, deprecated)
- `is_placeholder` (boolean, default: false)
- `template_id` (uuid, FK → gift_templates, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `gift_givers`
Many-to-many relationship between gifts and givers.
- `id` (uuid, PK)
- `gift_id` (uuid, FK → gifts)
- `giver_id` (uuid, FK → givers)
- `created_at` (timestamp)

#### `recipient_notes`
Rich notes for recipients.
- `id` (uuid, PK)
- `recipient_id` (uuid, FK → recipients)
- `household_id` (uuid, FK → households)
- `content` (text)
- `link_url` (text, nullable)
- `link_label` (text, nullable)
- `display_order` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `gift_templates`
Reusable gift templates (future feature).
- `id` (uuid, PK)
- `household_id` (uuid, FK → households)
- `name` (text)
- `default_cost` (numeric, nullable)
- `default_giver_ids` (uuid[], nullable)
- `tag_icon` (text)
- `tag_color` (text)
- `display_order` (integer)
- `created_at` (timestamp)

#### `invite_codes`
Codes for joining households.
- `id` (uuid, PK)
- `household_id` (uuid, FK → households)
- `code` (text) - Generated code
- `created_by` (uuid) - User who created it
- `expires_at` (timestamp) - Default 7 days
- `used` (boolean, default: false)
- `created_at` (timestamp)

### Database Functions

#### `create_user_household_and_profile`
Creates a household, profile, and giver record for a new user.

#### `get_user_household_id`
Returns the household_id for a given user_id.

#### `join_household_by_code`
Joins a user to a household using an invite code.

#### `get_household_members`
Returns all members of the current user's household.

#### `generate_invite_code`
Generates a unique 6-character invite code.

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access data from their household
- Authenticated users required (policies are scoped to the `authenticated` role — e.g., `profiles` cannot be read anonymously)
- Household scoping enforced via `get_user_household_id(auth.uid())`
- Household creation is only possible through the `create_user_household_and_profile` security-definer function (direct anonymous inserts are rejected)

### Performance Indexes

Indexes exist on the hot query paths for scale: `gifts(recipient_id)`, `gifts(household_id)`, `gift_givers(gift_id)`, `gift_givers(giver_id)`, `recipient_notes(recipient_id)`, `recipients(household_id)`, `givers(household_id)`, `profiles(household_id)`.

## Component Structure

### Pages
- **`Auth.tsx`**: Google OAuth sign-in page
- **`Index.tsx`**: Main app entry, renders Summary component
- **`NotFound.tsx`**: 404 error page

### Core Components

#### `Summary.tsx`
Main dashboard showing summary statistics and recipient list.

#### `GiftTracker.tsx`
Primary component for viewing/managing recipients and gifts. Composed of smaller focused components in `src/components/gifts/`. Features:
- Recipient list with collapsible cards
- Alphabetical index navigation
- Search and filtering (by giver — including "My gifts" — completion, wrapping, cost status)
- Gift management (add, edit, delete)
- Swipeable gift items
- Mobile-optimized card expansion (click anywhere to expand)

#### `gifts/RecipientCard.tsx`
Single recipient card: header, per-gift stats, aggregated unique giver icons (shown even when collapsed), notes badge, and gift list.

#### `gifts/RecipientList.tsx`
Filtered recipient list with empty states and alphabet index.

#### `gifts/AddPersonDialog.tsx`
Add-recipient modal with unsaved-changes guard (self-contained state).

#### `gifts/CompletionDialog.tsx`
Completion confirmation with "mark all purchased/wrapped" options.

#### `ErrorBoundary.tsx`
App-level error boundary with a friendly fallback and reload action.

#### `GiftForm.tsx`
Form for adding/editing gifts with:
- Gift name, cost, URL, tracking fields
- Icon grid giver selection
- Placeholder gift toggle
- Purchase/wrapped status checkboxes

#### `SwipeableGiftItem.tsx`
Individual gift list item with:
- Swipe-to-reveal actions (edit/delete)
- Status checkboxes
- Giver icons display
- Placeholder gift styling

#### `RecipientNotes.tsx`
Manages notes for recipients with:
- Add/edit/delete notes
- Optional link attachment
- Reorderable notes

#### `GiftNotes.tsx`
Display component for rendering recipient notes with links.

#### `Settings.tsx`
Settings panel with tabs for:
- Profile management
- Household management (name, invite codes)
- Recipients management (bulk delete)

#### `Welcome.tsx`
Onboarding flow for new users to create/join household.

#### `JoinHousehold.tsx`
Page for joining existing household with invite code.

#### `ProtectedRoute.tsx`
Route guard ensuring authentication and household setup.

#### `TopNavigation.tsx`
Navigation bar with tabs (Recipients, Summary) and settings button.

#### `FloatingActionButton.tsx`
Animated FAB for adding recipients (uses custom ripple animation).

#### `AlphabetIndex.tsx`
Vertical A-Z index for quick navigation.

#### `ContextMenu.tsx`
Right-click context menu for recipient actions.

### Custom Hooks

#### `useAuth.ts`
Authentication logic (sign in/up/out, Google OAuth).

#### `useRecipients.ts`
CRUD operations for recipients.

#### `useGifts.ts`
CRUD operations for gifts, including multi-giver support.

#### `useGivers.ts`
Fetches and manages givers for the household, with a realtime subscription on the `givers` table.

#### `useGifts.ts` (note)
`useGifts` also subscribes to `gift_givers` changes so giver icons appear immediately after assignment without a manual refresh.

#### `useGiftGivers.ts`
Manages gift-giver relationships.

#### `useHousehold.ts`
Fetches household data for a user.

#### `useRecipientNotes.ts`
CRUD operations for recipient notes.

#### `useHapticFeedback.ts`
Provides haptic feedback on mobile devices.

#### `useScrollDirection.ts`
Detects scroll direction for UI animations.

#### `useAnimatedButton.ts`
Manages button animation states.

#### `use-mobile.tsx`
Detects if viewport is mobile (<768px).

### Utilities

#### `lib/currency.ts`
Currency formatting utilities.

#### `lib/urlValidation.ts`
URL validation logic.

#### `lib/noteUtils.tsx`
Note parsing and rendering utilities (linkify, etc.).

#### `lib/utils.ts`
General utility functions (classNames merging, etc.).

## Deployment

### Automatic Deployment
This project is built on Lovable and can be deployed with one click:

1. Navigate to your Lovable project
2. Click "Publish" button (top right on desktop, bottom right on mobile in Preview mode)
3. Click "Update" in the publish dialog to deploy frontend changes

**Note**: Backend changes (database migrations, edge functions) deploy automatically.

### Custom Domain
Connect a custom domain via Project → Settings → Domains. Requires a paid Lovable plan.

### Self-hosting (your own Mac, NAS or any Docker host)

See **[SELF-HOSTING.md](./SELF-HOSTING.md)** for the full walkthrough. `selfhost/`
runs the app together with the parts of Supabase it uses (Postgres, auth, REST,
realtime) behind a single port:

```bash
cd selfhost
./setup.sh                          # once: generates secrets into selfhost/.env
./restore.sh <lovable-export-file>  # loads your Lovable Cloud data and starts everything
```

Other households reach it through Tailscale Funnel. The repo-root `docker-compose.yml`
still serves just the app against an externally hosted Supabase project.

## Authentication

Two sign-in methods are available on the sign-in screen:

- **Google** — requires the OAuth client to list your app's origin and the
  backend's `/auth/v1/callback` redirect URI.
- **Email + password** — works with no third-party setup; useful as a fallback
  when self-hosting.

## Environment Variables

Build-time values, inlined by Vite (rebuild after changing them):
- `VITE_SUPABASE_URL` - backend URL (left empty by `selfhost/`, meaning "the same
  address the app is served from")
- `VITE_SUPABASE_PUBLISHABLE_KEY` - publishable/anon key (safe in the browser)
- `VITE_SUPABASE_PROJECT_ID` - project ID

On Lovable these are managed automatically in `.env`. When self-hosting, copy
`.env.example` to `.env` and fill them in. Never put the `service_role` key here.

## Development Tips

### Code Organization
- Keep components focused and single-purpose
- Use custom hooks for data fetching logic
- Leverage React Query for caching and optimistic updates
- Use TypeScript for type safety

### Styling
- Use semantic tokens from `index.css` and `tailwind.config.ts`
- Avoid hardcoded colors (use HSL variables)
- Components should support light/dark mode
- Mobile-first responsive design

### Database Changes
- Use database migrations tool for schema changes
- Always include RLS policies for new tables
- Test with multiple users in same household

### Testing
- Test on mobile devices (touch interactions, swipes)
- Test with multiple household members
- Test RLS policies (can't see other households' data)

## Resources

- **Lovable Documentation**: [docs.lovable.dev](https://docs.lovable.dev/)
- **Project URL**: [Lovable Project](https://lovable.dev/projects/d5c3b05d-906a-40d0-88c5-08fa200d1bfe)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **React Query Docs**: [tanstack.com/query](https://tanstack.com/query/latest)

## License

This project is private and proprietary.

## Support

For issues or questions:
1. Check the [Lovable Discord community](https://discord.com/channels/1119885301872070706/1280461670979993613)
2. Review [Lovable documentation](https://docs.lovable.dev/)
3. Contact your project administrator
