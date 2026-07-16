export type EmailDeliveryStatus = "accepted" | "mocked" | "failed";

export type EmailDeliveryResult = {
  status: EmailDeliveryStatus;
  provider: string;
  providerMessageId?: string;
  safePreviewUrl?: string;
};

export type FamilyInvitationEmailInput = {
  toEmail: string;
  inviterName: string;
  familySpaceName: string;
  roleLabel: string;
  invitationUrl: string;
  locale?: string;
};

export interface EmailProvider {
  sendFamilyInvitation(
    input: FamilyInvitationEmailInput
  ): Promise<EmailDeliveryResult>;
}

export class MockEmailProvider implements EmailProvider {
  async sendFamilyInvitation(
    input: FamilyInvitationEmailInput
  ): Promise<EmailDeliveryResult> {
    if (process.env.NODE_ENV === "production") {
      return {
        status: "failed",
        provider: "mock",
      };
    }

    return {
      status: "mocked",
      provider: "mock",
      safePreviewUrl: input.invitationUrl,
    };
  }
}

export function getEmailProvider(): EmailProvider {
  return new MockEmailProvider();
}
