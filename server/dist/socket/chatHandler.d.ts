import { Server } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents } from '../types';
type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;
declare const chatHandler: (io: TypedIO) => void;
export default chatHandler;
//# sourceMappingURL=chatHandler.d.ts.map