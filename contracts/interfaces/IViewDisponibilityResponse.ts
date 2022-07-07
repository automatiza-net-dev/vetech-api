export default interface IViewDisponibilityResponse {
  date: string;
  events: Array<{
    start: string;
    end: string;
    type: string;
    user_id: string;
    event_id: string;
  }>;
}
