import { NextResponse } from "next/server";
import { BillingLimitError, billingService } from "@/server/billing/billing-service";
import { createRequestTranslator } from "@/shared/i18n/server";
import type { SubscriptionPlan } from "@/shared/types/billing";

export async function GET(request: Request) {
  const { t } = createRequestTranslator(request);

  try {
    const snapshot = await billingService.getSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("api.billing.fetchFailed")
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { t } = createRequestTranslator(request);

  try {
    const body = (await request.json().catch(() => ({}))) as {
      targetPlan?: SubscriptionPlan;
      note?: string;
      companyName?: string;
      contactName?: string;
      contactPhone?: string;
      amountLabel?: string;
      paymentMethod?: string;
      paymentReference?: string;
      payerName?: string;
      payerPhone?: string;
      submitOrder?: boolean;
    };

    if (!body.targetPlan) {
      return NextResponse.json(
        {
          error: t("api.billing.targetPlanRequired")
        },
        { status: 400 }
      );
    }

    if (body.submitOrder) {
      const order = await billingService.createBillingOrder(body.targetPlan, {
        amountLabel: body.amountLabel,
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference,
        payerName: body.payerName,
        payerPhone: body.payerPhone,
        note: body.note
      });

      return NextResponse.json({
        message: t("api.billing.orderCreated"),
        order
      });
    }

    const upgradeRequest = await billingService.createUpgradeRequest(body.targetPlan, {
      note: body.note,
      companyName: body.companyName,
      contactName: body.contactName,
      contactPhone: body.contactPhone
    });

    return NextResponse.json({
      message: t("api.billing.upgradeRequestCreated"),
      upgradeRequest
    });
  } catch (error) {
    return NextResponse.json(
        {
          error: error instanceof Error ? error.message : t("api.billing.orderCreateFailed")
        },
        { status: 400 }
      );
  }
}

export async function PATCH(request: Request) {
  const { t } = createRequestTranslator(request);

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "cancel";
    };

    if (body.action !== "cancel") {
      return NextResponse.json(
        {
          error: t("api.billing.cancelUpgradeInvalid")
        },
        { status: 400 }
      );
    }

    const upgradeRequest = await billingService.cancelUpgradeRequest();

    return NextResponse.json({
      message: t("api.billing.upgradeRequestCanceled"),
      upgradeRequest
    });
  } catch (error) {
    if (error instanceof BillingLimitError) {
      const message =
        error.code === "NO_PENDING_UPGRADE_REQUEST" ? t("api.billing.cancelUpgradeFailed") : error.message;

      return NextResponse.json(
        {
          error: message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("api.billing.cancelUpgradeFailed")
      },
      { status: 400 }
    );
  }
}
