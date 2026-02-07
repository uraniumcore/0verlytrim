import express from "express";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import bookingRoutes from "./routes/booking.routes.ts"
import serviceRoutes from "./routes/service.routes.ts";

import errorMiddleware from "./middleware/error.middleware.ts";

const app = express();

// global middleware
app.use(express.json());
app.use(morgan('dev'));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/service", serviceRoutes);

// error handler
app.use(errorMiddleware);


export default app;