let activeRequirement = null;

/* ==========================================
   HELPERS
========================================== */

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    if (!dateString) return "Not specified";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}

function formatDateTime(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

/* ==========================================
   NAVIGATION
========================================== */

function scrollToPost() {
    const section =
        document.getElementById("post");

    if (section) {
        section.scrollIntoView({
            behavior: "smooth"
        });
    }
}

/* ==========================================
   QUICK AI ANALYZER
========================================== */

function quickAnalyze() {
    const input =
        document.getElementById(
            "quickRequirement"
        );

    const result =
        document.getElementById(
            "quickResult"
        );

    if (!input || !result) return;

    const text =
        input.value.trim();

    if (!text) {
        showToast(
            "Please describe what you need 🤖"
        );
        return;
    }

    const lower =
        text.toLowerCase();

    let category = "General";

    if (
        lower.includes("laptop") ||
        lower.includes("phone") ||
        lower.includes("mobile") ||
        lower.includes("computer") ||
        lower.includes("tablet")
    ) {
        category = "Electronics";
    } else if (
        lower.includes("photographer") ||
        lower.includes("developer") ||
        lower.includes("designer") ||
        lower.includes("website") ||
        lower.includes("app")
    ) {
        category = "Services";
    } else if (
        lower.includes("course") ||
        lower.includes("teacher") ||
        lower.includes("tutor") ||
        lower.includes("training")
    ) {
        category = "Education";
    } else if (
        lower.includes("travel") ||
        lower.includes("trip") ||
        lower.includes("hotel") ||
        lower.includes("flight")
    ) {
        category = "Travel";
    }

    const budgetMatch =
        text.match(
            /(?:₹|rs\.?|inr)\s?[\d,]+/i
        );

    const timeMatch =
        text.match(
            /\d+\s*(?:day|days|week|weeks)/i
        );

    const budget =
        budgetMatch
            ? budgetMatch[0]
            : "Not detected";

    const timeline =
        timeMatch
            ? timeMatch[0]
            : "Not detected";

    result.innerHTML = `
        <div class="ai-result-content">
            <strong>🤖 AI Analysis</strong>

            <div class="ai-analysis-grid">
                <div>
                    <small>Category</small>
                    <strong>${escapeHTML(category)}</strong>
                </div>

                <div>
                    <small>Budget</small>
                    <strong>${escapeHTML(budget)}</strong>
                </div>

                <div>
                    <small>Timeline</small>
                    <strong>${escapeHTML(timeline)}</strong>
                </div>
            </div>

            <p>
                AI understood your requirement.
                You can now post it and let providers
                compete for the best deal.
            </p>
        </div>
    `;

    result.classList.remove("hidden");
}

/* ==========================================
   CREATE REQUIREMENT
========================================== */

async function createRequirement() {
    const title =
        document.getElementById(
            "reqTitle"
        ).value.trim();

    const description =
        document.getElementById(
            "reqDescription"
        ).value.trim();

    const category =
        document.getElementById(
            "reqCategory"
        ).value;

    const budget =
        document.getElementById(
            "reqBudget"
        ).value;

    const deadline =
        document.getElementById(
            "reqDeadline"
        ).value;

    if (!title || !description) {
        showToast(
            "Please enter title and description"
        );
        return;
    }

    try {
        const response =
            await fetch(
                "/api/requirements",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        category,
                        budget,
                        deadline
                    })
                }
            );

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(
                data.message ||
                "Could not create requirement"
            );
        }

        activeRequirement =
            data.requirement;

        localStorage.setItem(
            "match2dealActiveRequirement",
            JSON.stringify(
                activeRequirement
            )
        );

        renderRequirement();

        showToast(
            "Requirement posted successfully 🚀"
        );

        const provider =
            document.getElementById(
                "provider"
            );

        if (provider) {
            setTimeout(() => {
                provider.scrollIntoView({
                    behavior: "smooth"
                });
            }, 300);
        }

    } catch (error) {
        console.error(error);

        showToast(
            error.message ||
            "Something went wrong"
        );
    }
}

/* ==========================================
   RENDER ACTIVE REQUIREMENT
========================================== */

function renderRequirement() {
    const section =
        document.getElementById(
            "activeRequirement"
        );

    if (!section || !activeRequirement) {
        return;
    }

    section.classList.remove("hidden");

    section.innerHTML = `
        <div class="requirement-card">
            <div class="requirement-header">
                <div>
                    <span class="status-badge">
                        ACTIVE REQUIREMENT
                    </span>

                    <h3>
                        ${escapeHTML(
                            activeRequirement.title
                        )}
                    </h3>
                </div>

                <div class="requirement-id">
                    ${escapeHTML(
                        activeRequirement.id
                    )}
                </div>
            </div>

            <p>
                ${escapeHTML(
                    activeRequirement.description
                )}
            </p>

            <div class="requirement-meta">
                <span>
                    📂 ${escapeHTML(
                        activeRequirement.category ||
                        "General"
                    )}
                </span>

                <span>
                    💰 ${
                        activeRequirement.budget
                            ? "₹" +
                              Number(
                                  activeRequirement.budget
                              ).toLocaleString("en-IN")
                            : "No budget"
                    }
                </span>

                <span>
                    📅 ${
                        activeRequirement.deadline
                            ? formatDate(
                                  activeRequirement.deadline
                              )
                            : "Flexible"
                    }
                </span>
            </div>
        </div>
    `;
}

/* ==========================================
   SUBMIT OFFER
========================================== */

async function submitOffer() {
    if (!activeRequirement) {
        showToast(
            "Please create a requirement first"
        );
        scrollToPost();
        return;
    }

    const providerName =
        document.getElementById(
            "providerName"
        ).value.trim();

    const price =
        document.getElementById(
            "offerPrice"
        ).value;

    const deliveryDays =
        document.getElementById(
            "deliveryDays"
        ).value;

    const description =
        document.getElementById(
            "offerDescription"
        ).value.trim();

    if (
        !providerName ||
        !price ||
        !deliveryDays
    ) {
        showToast(
            "Please fill provider, price and delivery"
        );
        return;
    }

    try {
        const response =
            await fetch(
                "/api/offers",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        requirementId:
                            activeRequirement.id,
                        providerName,
                        price,
                        deliveryDays,
                        description
                    })
                }
            );

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(
                data.message ||
                "Could not submit offer"
            );
        }

        document.getElementById(
            "providerName"
        ).value = "";

        document.getElementById(
            "offerPrice"
        ).value = "";

        document.getElementById(
            "deliveryDays"
        ).value = "";

        document.getElementById(
            "offerDescription"
        ).value = "";

        showToast(
            "Offer submitted successfully 💰"
        );

        await loadOffers();

        const offersSection =
            document.getElementById(
                "offers"
            );

        if (offersSection) {
            setTimeout(() => {
                offersSection.scrollIntoView({
                    behavior: "smooth"
                });
            }, 300);
        }

    } catch (error) {
        console.error(error);

        showToast(
            error.message ||
            "Could not submit offer"
        );
    }
}

/* ==========================================
   LOAD OFFERS
========================================== */

async function loadOffers() {
    if (!activeRequirement) {
        return;
    }

    try {
        const response =
            await fetch(
                `/api/requirements/${encodeURIComponent(
                    activeRequirement.id
                )}/offers`
            );

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(
                data.message ||
                "Could not load offers"
            );
        }

        renderOffers(
            data.offers || []
        );

    } catch (error) {
        console.error(error);

        const container =
            document.getElementById(
                "offersContainer"
            );

        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    ❌ Could not load offers.
                    Please refresh the page.
                </div>
            `;
        }
    }
}

/* ==========================================
   MATCH LABEL
========================================== */

function getMatchLabel(score) {
    if (score >= 90) {
        return "🔥 Excellent Match";
    }

    if (score >= 80) {
        return "⭐ Strong Match";
    }

    if (score >= 70) {
        return "👍 Good Match";
    }

    if (score >= 60) {
        return "🙂 Fair Match";
    }

    return "⚠️ Low Match";
}

/* ==========================================
   RENDER OFFERS
========================================== */

function renderOffers(offers) {
    const container =
        document.getElementById("offersContainer");

    const stats =
        document.getElementById("offerStats");

    if (!container) return;

    if (!offers.length) {
        if (stats) {
            stats.classList.add("hidden");
        }

        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size:40px;">🏪</div>

                <h3>
                    Waiting for provider offers
                </h3>

                <p>
                    Providers will appear here
                    when they submit their deals.
                </p>
            </div>
        `;

        return;
    }

    /* ==========================================
       BASIC STATS
    ========================================== */

    if (stats) {
        stats.classList.remove("hidden");

        const best = offers[0];

        const cheapest =
            [...offers].sort(
                (a, b) => Number(a.price) - Number(b.price)
            )[0];

        const fastest =
            [...offers].sort(
                (a, b) =>
                    Number(a.deliveryDays) -
                    Number(b.deliveryDays)
            )[0];

        stats.innerHTML = `
            <div class="stat-card">
                <span>📦 Offers</span>
                <strong>${offers.length}</strong>
            </div>

            <div class="stat-card">
                <span>🤖 Best Match</span>
                <strong>
                    ${best.match?.finalScore || 0}%
                </strong>
            </div>

            <div class="stat-card">
                <span>💰 Cheapest</span>
                <strong>
                    ₹${Number(
                        cheapest.price
                    ).toLocaleString("en-IN")}
                </strong>
            </div>

            <div class="stat-card">
                <span>⚡ Fastest</span>
                <strong>
                    ${fastest.deliveryDays} days
                </strong>
            </div>
        `;
    }

    /* ==========================================
       AI DEAL INTELLIGENCE
    ========================================== */

    const requirementBudget =
        Number(activeRequirement?.budget || 0);

    const analyzedOffers =
        offers.map((offer) => {

            const match = offer.match || {};

            const score =
                Number(match.finalScore || 0);

            const budgetScore =
                Number(match.budgetScore || 0);

            const deliveryScore =
                Number(match.deliveryScore || 0);

            const relevanceScore =
                Number(match.relevanceScore || 0);

            const trustScore =
                Number(
                    match.trustScore ??
                    offer.trustScore ??
                    0
                );

            const price =
                Number(offer.price || 0);

            const delivery =
                Number(offer.deliveryDays || 0);

            const savings =
                requirementBudget > 0 &&
                price < requirementBudget
                    ? requirementBudget - price
                    : 0;

            const savingsPercent =
                requirementBudget > 0
                    ? Math.round(
                        (savings /
                            requirementBudget) *
                        100
                    )
                    : 0;

            let intelligence =
                "Balanced deal with a good overall fit.";

            let recommendation =
                "CONSIDER";

            let recommendationIcon =
                "👍";

            if (
                score >= 90 &&
                trustScore >= 80
            ) {
                intelligence =
                    "Excellent overall deal. Strong price, delivery, relevance and provider trust make this a high-confidence choice.";

                recommendation =
                    "HIGHLY RECOMMENDED";

                recommendationIcon =
                    "🏆";
            } else if (
                score >= 80 &&
                budgetScore >= 80
            ) {
                intelligence =
                    "Strong value-for-money offer with excellent budget compatibility.";

                recommendation =
                    "RECOMMENDED";

                recommendationIcon =
                    "⭐";
            } else if (
                deliveryScore >= 90
            ) {
                intelligence =
                    "Best suited when delivery speed is the priority.";

                recommendation =
                    "FASTEST CHOICE";

                recommendationIcon =
                    "⚡";
            } else if (
                budgetScore >= 90
            ) {
                intelligence =
                    "This offer gives strong savings while staying compatible with your budget.";

                recommendation =
                    "BEST VALUE";

                recommendationIcon =
                    "💰";
            } else if (
                relevanceScore >= 90
            ) {
                intelligence =
                    "Very strong requirement match. The provider's offer closely fits what you asked for.";

                recommendation =
                    "BEST FIT";

                recommendationIcon =
                    "🎯";
            } else if (
                trustScore >= 90
            ) {
                intelligence =
                    "Provider trust is excellent, making this a safer choice despite other trade-offs.";

                recommendation =
                    "TRUSTED CHOICE";

                recommendationIcon =
                    "🛡️";
            } else if (
                score < 60
            ) {
                intelligence =
                    "This deal has noticeable trade-offs. Compare it carefully with the stronger offers.";

                recommendation =
                    "LOW PRIORITY";

                recommendationIcon =
                    "⚠️";
            }

            const reasons =
                Array.isArray(match.reasons)
                    ? [...match.reasons]
                    : [];

            /* Add client-side intelligence */

            if (savings > 0) {
                reasons.push(
                    `Saves ₹${savings.toLocaleString("en-IN")} (${savingsPercent}%) vs your budget`
                );
            }

            if (
                requirementBudget > 0 &&
                price > requirementBudget
            ) {
                const extra =
                    price - requirementBudget;

                reasons.push(
                    `₹${extra.toLocaleString("en-IN")} above your budget`
                );
            }

            if (delivery <= 3) {
                reasons.push(
                    "Very fast delivery"
                );
            }

            if (trustScore >= 90) {
                reasons.push(
                    "Highly trusted provider"
                );
            }

            return {
                ...offer,
                match,
                score,
                budgetScore,
                deliveryScore,
                relevanceScore,
                trustScore,
                price,
                delivery,
                savings,
                savingsPercent,
                intelligence,
                recommendation,
                recommendationIcon,
                reasons
            };
        });

    /* ==========================================
       AI RANKING
    ========================================== */

    analyzedOffers.sort(
        (a, b) =>
            b.score - a.score
    );

    /* ==========================================
       RENDER CARDS
    ========================================== */

    container.innerHTML =
        analyzedOffers.map(
            (offer, index) => {

                const bestClass =
                    index === 0
                        ? " best-offer"
                        : "";

                const matchLabel =
                    getMatchLabel(
                        offer.score
                    );

                const reasons =
                    offer.reasons
                        .slice(0, 5);

                return `
                    <div class="offer-card${bestClass}">

                        ${
                            index === 0
                                ? `
                                    <div class="best-badge">
                                        🏆 AI TOP RECOMMENDATION
                                    </div>
                                `
                                : ""
                        }

                        <div class="offer-top">

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        offer.providerName
                                    )}
                                </h3>

                                <div class="provider-trust">
                                    🛡️ Trust Score:
                                    <strong>
                                        ${offer.trustScore}
                                    </strong>
                                </div>

                            </div>

                            <div class="match-score">

                                <strong>
                                    ${offer.score}%
                                </strong>

                                <span>
                                    Match
                                </span>

                            </div>

                        </div>

                        <div class="match-label">
                            ${matchLabel}
                        </div>

                        <!-- AI RECOMMENDATION -->

                        <div
                            style="
                                margin-top:16px;
                                padding:16px;
                                border-radius:16px;
                                background:rgba(124,92,255,0.10);
                                border:1px solid rgba(124,92,255,0.20);
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    gap:12px;
                                    align-items:center;
                                    flex-wrap:wrap;
                                "
                            >

                                <strong>
                                    🤖 AI Deal Intelligence
                                </strong>

                                <span
                                    style="
                                        font-size:12px;
                                        font-weight:800;
                                    "
                                >
                                    ${offer.recommendationIcon}
                                    ${offer.recommendation}
                                </span>

                            </div>

                            <p
                                style="
                                    margin:10px 0 0;
                                    line-height:1.6;
                                    opacity:.9;
                                "
                            >
                                ${escapeHTML(
                                    offer.intelligence
                                )}
                            </p>

                        </div>

                        <!-- OFFER DETAILS -->

                        <div class="offer-details">

                            <div>
                                <span>💰 Price</span>

                                <strong>
                                    ₹${offer.price.toLocaleString(
                                        "en-IN"
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>🚚 Delivery</span>

                                <strong>
                                    ${offer.delivery} days
                                </strong>
                            </div>

                            <div>
                                <span>🛡️ Trust</span>

                                <strong>
                                    ${offer.trustScore}/100
                                </strong>
                            </div>

                            <div>
                                <span>🎯 Relevance</span>

                                <strong>
                                    ${offer.relevanceScore}%
                                </strong>
                            </div>

                        </div>

                        ${
                            offer.savings > 0
                                ? `
                                    <div
                                        style="
                                            margin-top:14px;
                                            padding:12px 14px;
                                            border-radius:12px;
                                            background:rgba(80,216,144,0.10);
                                            border:1px solid rgba(80,216,144,0.20);
                                        "
                                    >
                                        💰
                                        <strong>
                                            Saves ₹${offer.savings.toLocaleString(
                                                "en-IN"
                                            )}
                                        </strong>

                                        <span>
                                            (${offer.savingsPercent}% under budget)
                                        </span>
                                    </div>
                                `
                                : ""
                        }

                        <!-- AI SCORE BREAKDOWN -->

                        <div class="ai-verdict">

                            <div class="ai-verdict-title">

                                🤖
                                <strong>
                                    AI Match Breakdown
                                </strong>

                            </div>

                            <p>
                                ${
                                    escapeHTML(
                                        offer.match.verdict ||
                                        "AI evaluated this offer."
                                    )
                                }
                            </p>

                            <div class="ai-reasons">

                                ${
                                    reasons
                                        .map(
                                            reason =>
                                                `<span>
                                                    ✓ ${escapeHTML(
                                                        reason
                                                    )}
                                                </span>`
                                        )
                                        .join("")
                                }

                            </div>

                            <div class="ai-breakdown">

                                <div class="ai-score-item">

                                    <span>💰</span>

                                    <strong>
                                        ${offer.budgetScore}%
                                    </strong>

                                    <small>
                                        Budget
                                    </small>

                                </div>

                                <div class="ai-score-item">

                                    <span>🚚</span>

                                    <strong>
                                        ${offer.deliveryScore}%
                                    </strong>

                                    <small>
                                        Delivery
                                    </small>

                                </div>

                                <div class="ai-score-item">

                                    <span>🎯</span>

                                    <strong>
                                        ${offer.relevanceScore}%
                                    </strong>

                                    <small>
                                        Relevance
                                    </small>

                                </div>

                                <div class="ai-score-item">

                                    <span>🛡️</span>

                                    <strong>
                                        ${offer.trustScore}%
                                    </strong>

                                    <small>
                                        Trust
                                    </small>

                                </div>

                            </div>

                        </div>

                        ${
                            offer.description
                                ? `
                                    <p class="offer-description">
                                        ${escapeHTML(
                                            offer.description
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        <div class="offer-actions">

                            <button
                                class="primary-btn"
                                onclick="selectOffer('${offer.id}')"
                            >
                                🎉 Select Deal
                            </button>

                            <button
                                class="secondary-btn"
                                onclick="shortlistOffer('${offer.id}')"
                            >
                                ❤️ Shortlist
                            </button>

                        </div>

                    </div>
                `;
            }
        ).join("");
}
/* ==========================================
   TRACKER STYLES
========================================== */

function injectTrackerStyles() {
    if (
        document.getElementById(
            "trackerDynamicStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "trackerDynamicStyles";

    style.textContent = `
        .tracker-card {
            margin-top: 30px;
            padding: 28px;
            border-radius: 22px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.09);
        }

        .tracker-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
            margin-bottom: 24px;
        }

        .tracker-header h3 {
            margin: 8px 0;
            font-size: 24px;
        }

        .tracker-order-id {
            font-size: 12px;
            opacity: 0.65;
        }

        .tracker-status {
            padding: 10px 14px;
            border-radius: 999px;
            background: rgba(80,216,144,0.12);
            border: 1px solid rgba(80,216,144,0.25);
            font-size: 13px;
            font-weight: 700;
        }

        .tracker-delivery {
            padding: 16px;
            border-radius: 14px;
            background: rgba(124,92,255,0.10);
            border: 1px solid rgba(124,92,255,0.20);
            margin-bottom: 28px;
        }

        .tracker-progress {
            height: 8px;
            background: rgba(255,255,255,0.08);
            border-radius: 999px;
            overflow: hidden;
            margin: 14px 0 30px;
        }

        .tracker-progress-bar {
            height: 100%;
            width: 0%;
            background: linear-gradient(
                90deg,
                #7c5cff,
                #50d890
            );
            border-radius: 999px;
            transition: width 0.5s ease;
        }

        .tracker-steps {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
        }

        .tracker-step {
            text-align: center;
            opacity: 0.45;
        }

        .tracker-step.active {
            opacity: 1;
        }

        .tracker-step-dot {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
        }

        .tracker-step.active
        .tracker-step-dot {
            background: rgba(124,92,255,0.25);
            border-color: rgba(124,92,255,0.6);
        }

        .tracker-step.done
        .tracker-step-dot {
            background: rgba(80,216,144,0.2);
            border-color: rgba(80,216,144,0.5);
        }

        .tracker-step small {
            display: block;
            font-size: 11px;
        }

        .tracker-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 28px;
        }

        .tracker-live {
            margin-top: 20px;
            padding: 14px;
            border-radius: 12px;
            background: rgba(255,255,255,0.04);
            font-size: 13px;
        }

        .tracker-complete {
            margin-top: 20px;
            padding: 18px;
            border-radius: 14px;
            background: rgba(80,216,144,0.10);
            border: 1px solid rgba(80,216,144,0.25);
        }

        @media (max-width: 700px) {
            .tracker-header {
                flex-direction: column;
            }

            .tracker-steps {
                grid-template-columns: 1fr;
                text-align: left;
            }

            .tracker-step {
                display: flex;
                align-items: center;
                gap: 12px;
                text-align: left;
            }

            .tracker-step-dot {
                margin: 0;
                flex-shrink: 0;
            }
        }
    `;

    document.head.appendChild(style);
}

/* ==========================================
   TRACKER CONTAINER
========================================== */

function ensureTrackerContainer() {
    let section =
        document.getElementById(
            "orderTracker"
        );

    if (section) {
        return section;
    }

    section =
        document.createElement("section");

    section.id =
        "orderTracker";

    section.className =
        "section";

    const offers =
        document.getElementById(
            "offers"
        );

    if (offers) {
        offers.after(section);
    } else {
        document.body.appendChild(
            section
        );
    }

    return section;
}

/* ==========================================
   TRACKER DATA
========================================== */

const trackerStatuses = [
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED"
];

const trackerLabels = [
    "Confirmed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered"
];

const trackerIcons = [
    "✓",
    "⚙️",
    "📦",
    "🚚",
    "🎉"
];

function getTrackerIndex(status) {
    const index =
        trackerStatuses.indexOf(
            status
        );

    return index >= 0
        ? index
        : 0;
}

/* ==========================================
   RENDER TRACKER
========================================== */

function renderTracker(order) {
    if (!order) return;

    injectTrackerStyles();

    const section =
        ensureTrackerContainer();

    const currentIndex =
        getTrackerIndex(
            order.status
        );

    const progress =
        (currentIndex /
            (trackerStatuses.length - 1)) *
        100;

    const latestHistory =
        order.history &&
        order.history.length
            ? order.history[
                  order.history.length - 1
              ]
            : null;

    section.innerHTML = `
        <div class="tracker-card">

            <div class="tracker-header">

                <div>
                    <span class="status-badge">
                        📦 ORDER TRACKING
                    </span>

                    <h3>
                        ${escapeHTML(
                            order.title
                        )}
                    </h3>

                    <div class="tracker-order-id">
                        Order ID:
                        ${escapeHTML(
                            order.id
                        )}
                    </div>
                </div>

                <div class="tracker-status">
                    ${escapeHTML(
                        order.status.replace(
                            /_/g,
                            " "
                        )
                    )}
                </div>

            </div>

            <div class="tracker-delivery">
                <strong>
                    🚚 Estimated Delivery
                </strong>

                <div style="margin-top:6px;">
                    ${formatDate(
                        order.estimatedDelivery
                    )}
                </div>
            </div>

            <div class="tracker-progress">
                <div
                    class="tracker-progress-bar"
                    style="width:${progress}%"
                ></div>
            </div>

            <div class="tracker-steps">

                ${trackerLabels
                    .map(
                        (label, index) => {
                            const isDone =
                                index <
                                currentIndex;

                            const isActive =
                                index <=
                                currentIndex;

                            return `
                                <div class="
                                    tracker-step
                                    ${
                                        isActive
                                            ? "active"
                                            : ""
                                    }
                                    ${
                                        isDone
                                            ? "done"
                                            : ""
                                    }
                                ">

                                    <div class="tracker-step-dot">
                                        ${
                                            isDone
                                                ? "✓"
                                                : trackerIcons[
                                                      index
                                                  ]
                                        }
                                    </div>

                                    <small>
                                        ${label}
                                    </small>

                                </div>
                            `;
                        }
                    )
                    .join("")}

            </div>

            ${
                latestHistory
                    ? `
                        <div class="tracker-live">
                            🔴 <strong>Live Update:</strong>
                            ${escapeHTML(
                                latestHistory.message ||
                                ""
                            )}

                            <div style="opacity:.55;margin-top:5px;">
                                ${formatDateTime(
                                    latestHistory.timestamp
                                )}
                            </div>
                        </div>
                    `
                    : ""
            }

            ${
                order.status ===
                "DELIVERED"
                    ? `
                        <div class="tracker-complete">
                            🎉
                            <strong>
                                Deal completed!
                            </strong>

                            <div style="margin-top:6px;">
                                Your order has been delivered successfully.
                            </div>
                        </div>
                    `
                    : `
                        <div class="tracker-actions">

                            <button
                                class="primary-btn"
                                onclick="simulateNextStatus()"
                            >
                                🚀 Demo: Mark as ${
                                    trackerLabels[
                                        Math.min(
                                            currentIndex + 1,
                                            trackerLabels.length - 1
                                        )
                                    ]
                                }
                            </button>

                            <button
                                class="secondary-btn"
                                onclick="refreshOrder()"
                            >
                                🔄 Refresh Tracking
                            </button>

                        </div>
                    `
            }

        </div>
    `;

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* ==========================================
   SELECT DEAL → CREATE ORDER
========================================== */

async function selectOffer(offerId) {
    if (!activeRequirement) {
        showToast(
            "No active requirement found"
        );
        return;
    }

    const confirmed =
        confirm(
            "Confirm this deal and start order tracking?"
        );

    if (!confirmed) {
        return;
    }

    try {
        showToast(
            "Creating your order..."
        );

        const response =
            await fetch(
                "/api/orders",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        requirementId:
                            activeRequirement.id,
                        offerId
                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "CREATE ORDER RESPONSE:",
            data
        );

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Could not create order"
            );
        }

        const order =
            data.order;

        localStorage.setItem(
            "match2dealOrder",
            JSON.stringify(order)
        );

        renderTracker(order);

        showToast(
            `Order ${order.id} confirmed! 📦`
        );

    } catch (error) {
        console.error(
            "ORDER ERROR:",
            error
        );

        showToast(
            error.message ||
            "Could not create order"
        );
    }
}

/* ==========================================
   REFRESH ORDER
========================================== */

async function refreshOrder() {
    const saved =
        localStorage.getItem(
            "match2dealOrder"
        );

    if (!saved) {
        showToast(
            "No active order found"
        );
        return;
    }

    try {
        const order =
            JSON.parse(saved);

        const response =
            await fetch(
                `/api/orders/${encodeURIComponent(
                    order.id
                )}`
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Order not found"
            );
        }

        localStorage.setItem(
            "match2dealOrder",
            JSON.stringify(
                data.order
            )
        );

        renderTracker(
            data.order
        );

        showToast(
            "Tracking refreshed 🔄"
        );

    } catch (error) {
        console.error(error);

        showToast(
            "Could not refresh tracking"
        );
    }
}

/* ==========================================
   SIMULATE NEXT STATUS
========================================== */

async function simulateNextStatus() {
    const saved =
        localStorage.getItem(
            "match2dealOrder"
        );

    if (!saved) {
        showToast(
            "No active order found"
        );
        return;
    }

    try {
        const order =
            JSON.parse(saved);

        const currentIndex =
            getTrackerIndex(
                order.status
            );

        const nextIndex =
            Math.min(
                currentIndex + 1,
                trackerStatuses.length - 1
            );

        if (
            nextIndex ===
            currentIndex
        ) {
            return;
        }

        const nextStatus =
            trackerStatuses[
                nextIndex
            ];

        const response =
            await fetch(
                `/api/orders/${encodeURIComponent(
                    order.id
                )}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        status:
                            nextStatus
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Could not update order"
            );
        }

        localStorage.setItem(
            "match2dealOrder",
            JSON.stringify(
                data.order
            )
        );

        renderTracker(
            data.order
        );

        showToast(
            `Order updated: ${nextStatus.replace(
                /_/g,
                " "
            )} 📦`
        );

    } catch (error) {
        console.error(error);

        showToast(
            error.message ||
            "Could not update order"
        );
    }
}

/* ==========================================
   SHORTLIST
========================================== */

function shortlistOffer(offerId) {
    let shortlist = [];

    try {
        shortlist =
            JSON.parse(
                localStorage.getItem(
                    "match2dealShortlist"
                )
            ) || [];
    } catch {
        shortlist = [];
    }

    if (!shortlist.includes(offerId)) {
        shortlist.push(offerId);

        localStorage.setItem(
            "match2dealShortlist",
            JSON.stringify(
                shortlist
            )
        );

        showToast(
            "Offer added to shortlist ❤️"
        );
    } else {
        showToast(
            "Already in shortlist ❤️"
        );
    }
}

/* ==========================================
   DEMO DATA
========================================== */

function loadDemo() {
    const today =
        new Date();

    today.setDate(
        today.getDate() + 3
    );

    const deadline =
        today
            .toISOString()
            .split("T")[0];

    const title =
        document.getElementById(
            "reqTitle"
        );

    const description =
        document.getElementById(
            "reqDescription"
        );

    const category =
        document.getElementById(
            "reqCategory"
        );

    const budget =
        document.getElementById(
            "reqBudget"
        );

    const deadlineInput =
        document.getElementById(
            "reqDeadline"
        );

    if (title) {
        title.value =
            "Need a high-performance laptop for development";
    }

    if (description) {
        description.value =
            "Looking for a reliable laptop for software development, AI tools, coding and everyday productivity.";
    }

    if (category) {
        category.value =
            "Electronics";
    }

    if (budget) {
        budget.value =
            "60000";
    }

    if (deadlineInput) {
        deadlineInput.value =
            deadline;
    }

    scrollToPost();

    showToast(
        "Demo requirement loaded 🚀"
    );
}

/* ==========================================
   RESTORE SAVED DATA
========================================== */

async function restoreOrder() {
    const saved =
        localStorage.getItem(
            "match2dealOrder"
        );

    if (!saved) {
        return;
    }

    try {
        const order =
            JSON.parse(saved);

        const response =
            await fetch(
                `/api/orders/${encodeURIComponent(
                    order.id
                )}`
            );

        if (!response.ok) {
            localStorage.removeItem(
                "match2dealOrder"
            );
            return;
        }

        const data =
            await response.json();

        if (data.success) {
            localStorage.setItem(
                "match2dealOrder",
                JSON.stringify(
                    data.order
                )
            );

            renderTracker(
                data.order
            );
        }

    } catch (error) {
        console.log(
            "No order to restore"
        );
    }
}

/* ==========================================
   START APP
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        injectTrackerStyles();

        const savedRequirement =
            localStorage.getItem(
                "match2dealActiveRequirement"
            );

        if (savedRequirement) {
            try {
                activeRequirement =
                    JSON.parse(
                        savedRequirement
                    );

                renderRequirement();

                await loadOffers();

            } catch (error) {
                console.error(
                    "Requirement restore error:",
                    error
                );
            }
        }

        await restoreOrder();
    }
);