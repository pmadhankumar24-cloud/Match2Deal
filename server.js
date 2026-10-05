const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

/* ==========================================
   MIDDLEWARE
========================================== */

app.use(express.json());
app.use(express.static(__dirname));

/* ==========================================
   IN-MEMORY DATABASE
========================================== */

let requirements = [];
let offers = [];
let orders = [];

/* ==========================================
   HELPERS
========================================== */

function normalizeText(value = "") {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getWords(value = "") {
    return normalizeText(value)
        .split(" ")
        .filter(word => word.length >= 3);
}

/* ==========================================
   TRUST SCORE
========================================== */

function calculateTrustScore(providerName = "") {
    const text = normalizeText(providerName);

    let score = 82;

    if (text.length >= 8) score += 3;
    if (text.includes("tech")) score += 4;
    if (text.includes("solution")) score += 3;
    if (text.includes("pro")) score += 2;
    if (text.includes("digital")) score += 2;

    let hash = 0;

    for (let i = 0; i < text.length; i++) {
        hash =
            (hash +
                text.charCodeAt(i) * (i + 1)) %
            10;
    }

    score += hash;

    return Math.min(
        100,
        Math.max(80, score)
    );
}

/* ==========================================
   RELEVANCE SCORE
========================================== */

function calculateRelevanceScore(
    requirement,
    offer
) {
    const requirementText =
        normalizeText(
            `${requirement.title} ${requirement.description} ${requirement.category}`
        );

    const offerText =
        normalizeText(
            `${offer.providerName} ${offer.description}`
        );

    const requirementWords =
        getWords(requirementText);

    const offerWords =
        getWords(offerText);

    if (
        !requirementWords.length ||
        !offerWords.length
    ) {
        return 60;
    }

    const offerSet =
        new Set(offerWords);

    let matches = 0;

    requirementWords.forEach(word => {
        if (offerSet.has(word)) {
            matches++;
        }
    });

    let score =
        50 +
        (matches / requirementWords.length) *
            50;

    const category =
        normalizeText(
            requirement.category
        );

    const categoryKeywords = {
        electronics: [
            "laptop",
            "computer",
            "phone",
            "mobile",
            "tablet",
            "electronics",
            "tech"
        ],

        services: [
            "developer",
            "designer",
            "photographer",
            "service",
            "software",
            "website",
            "app"
        ],

        education: [
            "course",
            "teacher",
            "tutor",
            "education",
            "training",
            "class"
        ],

        travel: [
            "travel",
            "trip",
            "hotel",
            "flight",
            "tour"
        ]
    };

    const keywords =
        categoryKeywords[category] || [];

    if (
        keywords.some(keyword =>
            offerText.includes(keyword)
        )
    ) {
        score += 10;
    }

    return Math.min(
        100,
        Math.round(score)
    );
}

/* ==========================================
   BUDGET SCORE
========================================== */

function calculateBudgetScore(
    requirement,
    offer
) {
    const budget =
        Number(requirement.budget || 0);

    const price =
        Number(offer.price || 0);

    if (!budget || budget <= 0) {
        return 85;
    }

    if (price <= budget) {
        const savingPercent =
            ((budget - price) / budget) *
            100;

        return Math.min(
            100,
            Math.round(
                90 + savingPercent * 0.5
            )
        );
    }

    const extraPercent =
        ((price - budget) / budget) *
        100;

    return Math.max(
        0,
        Math.round(
            100 - extraPercent * 2
        )
    );
}

/* ==========================================
   DELIVERY SCORE
========================================== */

function calculateDeliveryScore(
    requirement,
    offer
) {
    if (!requirement.deadline) {
        return 85;
    }

    const deadline =
        new Date(requirement.deadline);

    const today =
        new Date();

    deadline.setHours(
        23,
        59,
        59,
        999
    );

    today.setHours(
        0,
        0,
        0,
        0
    );

    const diffMs =
        deadline - today;

    const availableDays =
        Math.max(
            0,
            Math.ceil(
                diffMs /
                    (1000 *
                        60 *
                        60 *
                        24)
            )
        );

    const deliveryDays =
        Number(
            offer.deliveryDays || 0
        );

    if (
        deliveryDays <=
        availableDays
    ) {
        if (
            deliveryDays ===
            availableDays
        ) {
            return 90;
        }

        const extraBuffer =
            availableDays -
            deliveryDays;

        return Math.min(
            100,
            92 +
                extraBuffer * 3
        );
    }

    const lateDays =
        deliveryDays -
        availableDays;

    return Math.max(
        10,
        70 -
            lateDays * 15
    );
}

/* ==========================================
   MATCH ENGINE
========================================== */

function calculateMatchScore(
    requirement,
    offer
) {
    const budgetScore =
        calculateBudgetScore(
            requirement,
            offer
        );

    const deliveryScore =
        calculateDeliveryScore(
            requirement,
            offer
        );

    const trustScore =
        offer.trustScore ||
        calculateTrustScore(
            offer.providerName
        );

    const relevanceScore =
        calculateRelevanceScore(
            requirement,
            offer
        );

    const finalScore =
        Math.round(
            budgetScore * 0.35 +
                relevanceScore * 0.30 +
                deliveryScore * 0.20 +
                trustScore * 0.15
        );

    let verdict =
        "Good Deal";

    if (finalScore >= 90) {
        verdict =
            "Excellent Match";
    } else if (finalScore >= 80) {
        verdict =
            "Strong Match";
    } else if (finalScore >= 70) {
        verdict =
            "Good Match";
    } else if (finalScore >= 60) {
        verdict =
            "Fair Match";
    } else {
        verdict =
            "Low Match";
    }

    const reasons = [];

    if (budgetScore >= 90) {
        reasons.push(
            "Great budget fit"
        );
    } else if (budgetScore >= 70) {
        reasons.push(
            "Reasonable price"
        );
    } else {
        reasons.push(
            "Above target budget"
        );
    }

    if (deliveryScore >= 90) {
        reasons.push(
            "Fast delivery"
        );
    } else if (deliveryScore >= 70) {
        reasons.push(
            "Delivery looks workable"
        );
    } else {
        reasons.push(
            "Delivery may be late"
        );
    }

    if (relevanceScore >= 90) {
        reasons.push(
            "Highly relevant offer"
        );
    } else if (relevanceScore >= 70) {
        reasons.push(
            "Relevant to your need"
        );
    } else {
        reasons.push(
            "Limited requirement match"
        );
    }

    if (trustScore >= 90) {
        reasons.push(
            "High provider trust"
        );
    } else {
        reasons.push(
            "Trusted provider"
        );
    }

    return {
        finalScore,
        budgetScore,
        deliveryScore,
        trustScore,
        relevanceScore,
        verdict,
        reasons
    };
}

/* ==========================================
   HEALTH CHECK
========================================== */

app.get(
    "/api/status",
    (req, res) => {
        res.json({
            success: true,
            project: "Match2Deal",
            status: "ONLINE",
            ai: "READY",
            tracking: "ACTIVE"
        });
    }
);

/* ==========================================
   REQUIREMENTS
========================================== */

app.post(
    "/api/requirements",
    (req, res) => {
        const {
            title,
            description,
            category,
            budget,
            deadline
        } = req.body;

        if (
            !title ||
            !description
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Title and description are required"
            });
        }

        const requirement = {
            id: `REQ-${Date.now()}`,

            title:
                String(title).trim(),

            description:
                String(
                    description
                ).trim(),

            category:
                category ||
                "General",

            budget:
                Number(budget || 0),

            deadline:
                deadline || "",

            createdAt:
                new Date().toISOString()
        };

        requirements.push(
            requirement
        );

        res.json({
            success: true,
            requirement
        });
    }
);

app.get(
    "/api/requirements",
    (req, res) => {
        res.json({
            success: true,
            requirements
        });
    }
);

/* ==========================================
   OFFERS
========================================== */

app.post(
    "/api/offers",
    (req, res) => {
        const {
            requirementId,
            providerName,
            price,
            deliveryDays,
            description
        } = req.body;

        if (
            !requirementId ||
            !providerName ||
            price === undefined ||
            deliveryDays === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Requirement, provider, price and delivery are required"
            });
        }

        const requirement =
            requirements.find(
                item =>
                    item.id ===
                    requirementId
            );

        if (!requirement) {
            return res.status(404).json({
                success: false,
                message:
                    "Requirement not found"
            });
        }

        const offer = {
            id: `OFF-${Date.now()}`,

            requirementId,

            providerName:
                String(
                    providerName
                ).trim(),

            price:
                Number(price),

            deliveryDays:
                Number(
                    deliveryDays
                ),

            description:
                description || "",

            trustScore:
                calculateTrustScore(
                    providerName
                ),

            createdAt:
                new Date().toISOString()
        };

        offers.push(offer);

        res.json({
            success: true,
            offer
        });
    }
);

/* ==========================================
   MATCHED OFFERS
========================================== */

app.get(
    "/api/requirements/:id/offers",
    (req, res) => {
        const requirement =
            requirements.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!requirement) {
            return res.status(404).json({
                success: false,
                message:
                    "Requirement not found"
            });
        }

        const matchedOffers =
            offers
                .filter(
                    offer =>
                        offer.requirementId ===
                        requirement.id
                )
                .map(offer => ({
                    ...offer,

                    match:
                        calculateMatchScore(
                            requirement,
                            offer
                        )
                }))
                .sort(
                    (a, b) =>
                        b.match.finalScore -
                        a.match.finalScore
                );

        res.json({
            success: true,
            requirement,
            offers: matchedOffers
        });
    }
);

/* ==========================================
   CREATE ORDER
========================================== */

app.post(
    "/api/orders",
    (req, res) => {
        try {
            const {
                requirementId,
                offerId
            } = req.body;

            if (
                !requirementId ||
                !offerId
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "requirementId and offerId are required"
                });
            }

            const requirement =
                requirements.find(
                    item =>
                        item.id ===
                        requirementId
                );

            if (!requirement) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Requirement not found"
                });
            }

            const offer =
                offers.find(
                    item =>
                        item.id ===
                            offerId &&
                        item.requirementId ===
                            requirementId
                );

            if (!offer) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Offer not found"
                });
            }

            const now =
                new Date();

            const estimatedDelivery =
                new Date(now);

            estimatedDelivery.setDate(
                estimatedDelivery.getDate() +
                    Number(
                        offer.deliveryDays ||
                            0
                    )
            );

            const order = {
                id: `ORD-${Date.now()}`,

                requirementId,

                offerId,

                title:
                    requirement.title,

                description:
                    requirement.description,

                providerName:
                    offer.providerName,

                price:
                    offer.price,

                deliveryDays:
                    offer.deliveryDays,

                status:
                    "CONFIRMED",

                createdAt:
                    now.toISOString(),

                updatedAt:
                    now.toISOString(),

                estimatedDelivery:
                    estimatedDelivery.toISOString(),

                history: [
                    {
                        status:
                            "CONFIRMED",

                        timestamp:
                            now.toISOString(),

                        message:
                            "Deal confirmed successfully"
                    }
                ]
            };

            orders.push(order);

            console.log(
                `📦 Order created: ${order.id}`
            );

            return res.status(201).json({
                success: true,

                message:
                    "Order created successfully",

                order
            });

        } catch (error) {
            console.error(
                "Order creation error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not create order"
            });
        }
    }
);

/* ==========================================
   GET ORDER
========================================== */

app.get(
    "/api/orders/:id",
    (req, res) => {
        const order =
            orders.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }

        res.json({
            success: true,
            order
        });
    }
);

/* ==========================================
   UPDATE ORDER STATUS
========================================== */

app.patch(
    "/api/orders/:id/status",
    (req, res) => {
        const order =
            orders.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }

        const allowedStatuses = [
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "OUT_FOR_DELIVERY",
            "DELIVERED"
        ];

        const newStatus =
            req.body.status;

        if (
            !allowedStatuses.includes(
                newStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order status"
            });
        }

        const now =
            new Date().toISOString();

        order.status =
            newStatus;

        order.updatedAt =
            now;

        const messages = {
            CONFIRMED:
                "Deal confirmed successfully",

            PROCESSING:
                "Provider has started processing your order",

            SHIPPED:
                "Your order has been shipped",

            OUT_FOR_DELIVERY:
                "Your order is out for delivery",

            DELIVERED:
                "Your order has been delivered successfully"
        };

        order.history.push({
            status:
                newStatus,

            timestamp:
                now,

            message:
                messages[newStatus]
        });

        console.log(
            `📦 ${order.id} → ${newStatus}`
        );

        res.json({
            success: true,

            message:
                "Order status updated",

            order
        });
    }
);

/* ==========================================
   SERVER ERROR HANDLERS
========================================== */

process.on(
    "uncaughtException",
    error => {
        console.error(
            "❌ UNCAUGHT EXCEPTION:",
            error
        );
    }
);

process.on(
    "unhandledRejection",
    error => {
        console.error(
            "❌ UNHANDLED REJECTION:",
            error
        );
    }
);

/* ==========================================
   START SERVER
========================================== */

const server = app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "          MATCH2DEAL 🚀"
        );
        console.log(
            "========================================"
        );
        console.log("");

        console.log(
            `Website: http://localhost:${PORT}`
        );

        console.log("");

        console.log(
            `API: http://localhost:${PORT}/api/status`
        );

        console.log("");

        console.log(
            "AI Matching: ACTIVE 🧠"
        );

        console.log(
            "Order Tracking: ACTIVE 📦"
        );

        console.log("");

        console.log(
            "========================================"
        );

        console.log(
            "SERVER RUNNING - KEEP THIS TERMINAL OPEN"
        );

        console.log(
            "========================================"
        );

        console.log("");
    }
);

server.on(
    "error",
    error => {
        console.error("");
        console.error(
            "❌ SERVER ERROR"
        );
        console.error(error);
        console.error("");

        if (
            error.code ===
            "EADDRINUSE"
        ) {
            console.error(
                `Port ${PORT} is already being used.`
            );

            console.error(
                `Run: netstat -ano | findstr :${PORT}`
            );
        }
    }
);

server.on(
    "close",
    () => {
        console.log(
            "⚠️ Match2Deal server closed."
        );
    }
);