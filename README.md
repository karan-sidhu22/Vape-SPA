# Vape-SPA 🛍️

A full-stack e-commerce web application built with **Next.js** and
**Supabase**, featuring modern UI, secure authentication, and essential
shopping features like cart, wishlist, checkout, and order history.

🔗 **Live Demo:** [Vape-SPA on Vercel](https://vape-spa.vercel.app/)

------------------------------------------------------------------------

## 🚀 Features

-   **Authentication**: User sign-up/sign-in with Supabase\
-   **Cart & Wishlist**: Add, update, and remove items\
-   **Checkout Flow**: Place orders with auto stock management\
-   **Order History**: View past orders with details\
-   **My Account**: Update profile, phone, and address with Google Maps
    autocomplete\
-   **Responsive Design**: Works seamlessly on desktop and mobile\
-   **Glassmorphism UI**: Modern dark theme with subtle transparency
    effects\
-   **Secure Age Verification**: 19+ age gate on first visit

------------------------------------------------------------------------

## 🛠️ Tech Stack

**Frontend**\
- [Next.js 14](https://nextjs.org/)\
- [React](https://react.dev/)\
- [TailwindCSS](https://tailwindcss.com/)\
- [Lucide React Icons](https://lucide.dev/)

**Backend / Database**\
- [Supabase](https://supabase.com/) (Auth + Postgres DB)

**Deployment**\
- [Vercel](https://vercel.com/)

------------------------------------------------------------------------

## 📂 Project Structure

    app/
     ┣ (protected)/         # Protected routes (cart, checkout, account, order history)
     ┣ components/          # Reusable UI components (Header, Footer, etc.)
     ┣ signup/              # User registration
     ┣ signin/              # User login
     ┣ wishlist/            # Wishlist page
     ┣ cart/                # Cart page
     ┣ checkout/            # Checkout page
     ┣ order-history/       # User order history
     ┗ home/                # Main landing page

------------------------------------------------------------------------

## ⚙️ Setup & Installation

1.  **Clone the repository**

    ``` bash
    git clone https://github.com/your-username/vape-spa.git
    cd vape-spa
    ```

2.  **Install dependencies**

    ``` bash
    npm install
    ```

3.  **Set up environment variables**\
    Create a `.env.local` file in the project root:

    ``` env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
    ```

4.  **Run development server**

    ``` bash
    npm run dev
    ```

    Visit `http://localhost:3000` 🎉

------------------------------------------------------------------------

## 📸 Screenshots

### 🏠 Landing Page

![Landing Page](./public/screenshots/landing.png)

### 🛒 Cart

![Cart](./public/screenshots/cart.png)

### 📦 Checkout

![Checkout](./public/screenshots/checkout.png)

------------------------------------------------------------------------

## ✅ To-Do / Future Enhancements

-   [ ] Payment gateway integration (Stripe/PayPal)\
-   [ ] Admin dashboard for managing products & orders\
-   [ ] Product reviews and ratings\
-   [ ] Email order confirmations

------------------------------------------------------------------------

## 📜 License

This project is licensed under the MIT License.

------------------------------------------------------------------------

## 👨‍💻 Author

Built with ❤️ by **[Harkaran Singh](https://github.com/karan-sidhu22)**\
- 📧 harkaran2004.jpr@gmail.com\
- 📞 +1 (403)-690-1169\
- 🔗 [LinkedIn](https://www.linkedin.com/in/harkaran-singh)
