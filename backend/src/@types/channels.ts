declare namespace ChannelRouteTypes {
  export interface ChannelParams {
    channelId: string;
  }

  export interface CreateChannelBody {
    name: string;
    description?: string;
    category?: "public" | "private" | "team";
  }

  export interface GetMessagesQuery {
    limit?: string;
    before?: string;
  }
}
