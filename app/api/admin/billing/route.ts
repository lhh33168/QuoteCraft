import { NextResponse } from "next/server";
import { BillingLimitError, billingService } from "@/server/billing/billing-service";
import { createRequestTranslator } from "@/shared/i18n/server";

export async function GET(request: Request) {
  const { t } = createRequestTranslator(request);

  try {
    const [items, orders] = await Promise.all([
      billingService.listUpgradeRequests(),
      billingService.listBillingOrders()
    ]);

    return NextResponse.json({ items, orders });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === "Forbidden"
            ? t("api.billing.adminForbidden")
            : error instanceof Error
              ? error.message
              : t("api.billing.adminFetchFailed")
      },
      {
        status: error instanceof Error && error.message === "Forbidden" ? 403 : 500
      }
    );
  }
}

export async function PATCH(request: Request) {
  const { t } = createRequestTranslator(request);

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "review_request" | "change_plan" | "update_lifecycle" | "review_order";
      requestId?: string;
      orderId?: string;
      status?: "approved" | "rejected" | "canceled";
      orderStatus?: "pending_payment" | "submitted" | "confirmed" | "rejected" | "canceled";
      reviewedNote?: string;
      userId?: string;
      targetPlan?: "free" | "pro";
      lifecycleStatus?: "active" | "expired" | "inactive";
      expiresAt?: string | null;
    };

    if (body.action === "change_plan") {
      if (!body.userId || !body.targetPlan) {
        return NextResponse.json(
          {
            error: t("api.billing.adminPlanChangeInvalid")
          },
          { status: 400 }
        );
      }

      const result = await billingService.adminChangeUserPlan(body.userId, body.targetPlan);

      return NextResponse.json({
        message: t("api.billing.adminPlanChangeSuccess"),
        item: result
      });
    }

    if (body.action === "update_lifecycle") {
      if (!body.userId) {
        return NextResponse.json(
          {
            error: t("api.billing.adminLifecycleInvalid")
          },
          { status: 400 }
        );
      }

      if (body.expiresAt) {
        const expiresAtDate = new Date(body.expiresAt);

        if (Number.isNaN(expiresAtDate.getTime())) {
          return NextResponse.json(
            {
              error: t("api.billing.adminLifecycleInvalid")
            },
            { status: 400 }
          );
        }
      }

      const result = await billingService.adminUpdateLifecycle(body.userId, {
        plan: body.targetPlan,
        lifecycleStatus: body.lifecycleStatus,
        expiresAt: body.expiresAt ?? null
      });

      return NextResponse.json({
        message: t("api.billing.adminLifecycleSuccess"),
        item: result
      });
    }

    if (body.action === "review_order") {
      if (!body.orderId || !body.orderStatus) {
        return NextResponse.json(
          {
            error: t("api.billing.adminReviewInvalid")
          },
          { status: 400 }
        );
      }

      const item = await billingService.reviewBillingOrder(body.orderId, {
        status: body.orderStatus,
        reviewedNote: body.reviewedNote
      });

      return NextResponse.json({
        message: t("api.billing.adminReviewSuccess"),
        item
      });
    }

    if (!body.requestId || !body.status) {
      return NextResponse.json(
        {
          error: t("api.billing.adminReviewInvalid")
        },
        { status: 400 }
      );
    }

    const item = await billingService.reviewUpgradeRequest(body.requestId, body.status);

    return NextResponse.json({
      message: t("api.billing.adminReviewSuccess"),
      item
    });
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return NextResponse.json(
        {
          error:
            error.code === "INVALID_TARGET_PLAN"
              ? t("api.billing.adminPlanChangeInvalid")
              : error.code === "INVALID_LIFECYCLE_STATUS"
                ? t("api.billing.adminLifecycleInvalid")
              : t("api.billing.adminReviewInvalid")
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === "Forbidden"
            ? t("api.billing.adminForbidden")
            : error instanceof Error
              ? error.message
              : t("api.billing.adminReviewFailed")
      },
      {
        status: error instanceof Error && error.message === "Forbidden" ? 403 : 500
      }
    );
  }
}
