import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import {
  useGetTicketAssigneesQuery,
  useGetTicketQuery,
  useUpdateTicketAssigneeMutation,
  useUpdateTicketStatusMutation,
} from "../../services/tickets/ticketApi";
import {
  useCreateTicketCommentMutation,
  useGetTicketCommentsQuery,
} from "../../services/comments/commentApi";
import { isApiResponse } from "../../services/api/baseQuery";
import type { Ticket } from "../../types/ticket";
import {
  formatName,
  getStoredUser,
  priorityStyle,
  statusStyle,
  titleCase,
} from "../../util/helper";
import { hasRoleAccess, SUPPORT_ROLES } from "../../util/accessControl";

const STATUS_OPTIONS: Ticket["status"][] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

interface CommentFormValues {
  body: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    isApiResponse(error.data)
  ) {
    return error.data.message;
  }
  return fallback;
};

const formatTicketDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatTicketDate(value);
};

export const TicketDetails = () => {
  const { ticketId: ticketIdParam } = useParams<{ ticketId: string }>();
  const ticketId = Number(ticketIdParam);
  const isValidTicketId = Number.isInteger(ticketId) && ticketId > 0;
  const canManage = hasRoleAccess(getStoredUser()?.role, SUPPORT_ROLES);
  const [managementError, setManagementError] = useState("");
  const [commentError, setCommentError] = useState("");

  const {
    data: ticket,
    isLoading: isLoadingTicket,
    isError: isTicketError,
    error: ticketError,
    refetch: refetchTicket,
  } = useGetTicketQuery(ticketId, { skip: !isValidTicketId });
  const {
    data: comments = [],
    isLoading: isLoadingComments,
    isError: isCommentsError,
    refetch: refetchComments,
  } = useGetTicketCommentsQuery(ticketId, { skip: !isValidTicketId });
  const {
    data: assignees = [],
    isLoading: isLoadingAssignees,
    isError: isAssigneesError,
  } = useGetTicketAssigneesQuery(undefined, { skip: !canManage });
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateTicketStatusMutation();
  const [updateAssignee, { isLoading: isUpdatingAssignee }] =
    useUpdateTicketAssigneeMutation();
  const [createComment, { isLoading: isPostingComment }] =
    useCreateTicketCommentMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormValues>({ defaultValues: { body: "" } });

  const handleStatusChange = async (status: Ticket["status"]) => {
    if (!ticket) return;
    setManagementError("");
    try {
      await updateStatus({ ticketId: ticket.id, status }).unwrap();
    } catch (error) {
      setManagementError(
        getErrorMessage(error, "Unable to update the ticket status."),
      );
    }
  };

  const handleAssigneeChange = async (value: string) => {
    if (!ticket) return;
    setManagementError("");
    try {
      await updateAssignee({
        ticketId: ticket.id,
        assigneeId: value ? Number(value) : null,
      }).unwrap();
    } catch (error) {
      setManagementError(
        getErrorMessage(error, "Unable to update the ticket assignee."),
      );
    }
  };

  const submitComment = async ({ body }: CommentFormValues) => {
    setCommentError("");
    try {
      await createComment({ ticketId, body: body.trim() }).unwrap();
      reset();
    } catch (error) {
      setCommentError(getErrorMessage(error, "Unable to post the comment."));
    }
  };

  if (!isValidTicketId) {
    return (
      <section className="rounded-xl border border-gray-300 p-6">
        <h1 className="text-xl font-bold">Invalid ticket</h1>
        <Link to="/tickets" className="text-blaze-haze-700 mt-3 inline-block">
          ← Back to Tickets
        </Link>
      </section>
    );
  }

  if (isLoadingTicket) {
    return <p className="p-6 text-gray-600">Loading ticket…</p>;
  }

  if (isTicketError || !ticket) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-bold text-red-800">
          Unable to load this ticket
        </h1>
        <p className="mt-2 text-red-700">
          {getErrorMessage(
            ticketError,
            "The ticket may not exist or you may not have access.",
          )}
        </p>
        <div className="mt-4 flex gap-4">
          <button
            type="button"
            onClick={() => refetchTicket()}
            className="cursor-pointer font-semibold text-red-800 underline"
          >
            Retry
          </button>
          <Link to="/tickets" className="font-semibold text-red-800 underline">
            Back to Tickets
          </Link>
        </div>
      </section>
    );
  }

  return (
    <main className="space-y-7 pb-8">
      <Link
        to="/tickets"
        className="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        ← Back to Tickets
      </Link>

      <section>
        <h1 className="text-2xl font-bold">
          <span className="text-gray-600">#{ticket.id}</span> — {ticket.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="inline-flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5 shadow-sm">
            <span className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
              Status
            </span>
            {canManage ? (
              <select
                aria-label="Ticket status"
                value={ticket.status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as Ticket["status"])
                }
                disabled={isUpdatingStatus}
                className="w-36 cursor-pointer bg-transparent font-semibold text-teal-800 outline-none disabled:cursor-wait"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {titleCase(status)}
                  </option>
                ))}
              </select>
            ) : (
              <span className={statusStyle(ticket.status)}>
                {titleCase(ticket.status)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-gray-600">
            <span className="inline-flex items-center gap-2">
              Priority:
              <span
                className={`size-2.5 rounded-full ${priorityStyle(ticket.priority)}`}
                aria-hidden="true"
              />
              <span>{titleCase(ticket.priority)}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Category: {titleCase(ticket.category)}</span>
            <span aria-hidden="true">·</span>
            <span>Created {formatTicketDate(ticket.createdAtTimestamp)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4">
          <p>
            Requester:{" "}
            <strong>
              {ticket.requesterName
                ? formatName(ticket.requesterName)
                : `User #${ticket.requesterId ?? "—"}`}
            </strong>
          </p>
          <label className="block">
            <span className="mb-1 block">Assignee:</span>
            {canManage ? (
              <select
                value={ticket.assigneeId ?? ""}
                onChange={(event) => handleAssigneeChange(event.target.value)}
                disabled={
                  isLoadingAssignees || isAssigneesError || isUpdatingAssignee
                }
                className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 min-w-56 rounded-xl border border-gray-300 bg-white px-4 py-2 outline-none focus:ring-2 disabled:bg-gray-100"
              >
                <option value="">Unassigned</option>
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {formatName(assignee.name)}
                  </option>
                ))}
              </select>
            ) : (
              <strong>
                {ticket.assigneeName
                  ? formatName(ticket.assigneeName)
                  : "Unassigned"}
              </strong>
            )}
          </label>
        </div>

        {managementError && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {managementError}
          </p>
        )}
        {isAssigneesError && canManage && (
          <p className="mt-3 text-sm text-red-700">
            Unable to load active agents. Assignment changes are unavailable.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-300 p-7">
        <h2 className="text-lg font-bold tracking-wider text-gray-600">
          DESCRIPTION
        </h2>
        <p className="mt-5 text-lg leading-7 whitespace-pre-wrap">
          {ticket.description}
        </p>
      </section>

      <section className="rounded-2xl border border-gray-300 p-7">
        <h2 className="text-lg font-bold tracking-wider text-gray-600">
          COMMENTS ({comments.length})
        </h2>

        {isLoadingComments && (
          <p className="mt-6 text-gray-500">Loading comments…</p>
        )}
        {isCommentsError && (
          <div className="mt-6 flex items-center gap-3 text-red-700">
            <span>Unable to load comments.</span>
            <button
              type="button"
              onClick={() => refetchComments()}
              className="cursor-pointer font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}
        {!isLoadingComments && !isCommentsError && comments.length === 0 && (
          <p className="mt-6 text-gray-500">No comments yet.</p>
        )}
        {!isCommentsError && comments.length > 0 && (
          <div className="mt-5">
            {comments.map((comment) => (
              <article
                key={comment.id}
                className="border-b border-gray-200 py-5 first:pt-2 last:border-b-0 last:pb-0"
              >
                <p className="font-bold">
                  {formatName(comment.authorName)}
                  <span className="font-normal text-gray-600">
                    {" "}
                    · {formatRelativeTime(comment.createdAt)}
                  </span>
                </p>
                <p className="mt-1 text-lg whitespace-pre-wrap">
                  {comment.body}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <form
        onSubmit={handleSubmit(submitComment)}
        className="flex items-start gap-3"
      >
        <div className="grow">
          <input
            {...register("body", {
              required: "Enter a comment before posting",
              validate: (value) =>
                value.trim().length > 0 || "Enter a comment before posting",
              maxLength: {
                value: 4000,
                message: "Comment cannot exceed 4000 characters",
              },
            })}
            placeholder="Add a comment…"
            aria-label="Add a comment"
            className="focus:border-blaze-haze-600 focus:ring-blaze-haze-200 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2"
          />
          {(errors.body?.message || commentError) && (
            <p className="mt-2 text-sm text-red-700">
              {errors.body?.message ?? commentError}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isPostingComment}
          className="bg-blaze-haze-700 hover:bg-blaze-haze-600 cursor-pointer rounded-xl px-5 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {isPostingComment ? "Posting…" : "Post"}
        </button>
      </form>
    </main>
  );
};
