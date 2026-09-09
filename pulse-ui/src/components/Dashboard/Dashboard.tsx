import { useGetUserTicketsQuery } from "../../services/tickets/ticketApi";
import type { User } from "../../types/user";
import {
  getStoredUser,
  priorityStyle,
  statusStyle,
  titleCase,
} from "../../util/helper";
import { PriorityBreakdown } from "./PriorityBreakdown";

export default function Dashboard() {
  const user: User | null = getStoredUser();
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";

  const { data } = useGetUserTicketsQuery({
    page: 0,
    pageSize: 1000,
    sort: "asc",
  });
  console.log("data: ", data);
  return (
    <div>
      <div>
        <div className="text-pulse-green text-xl font-bold">
          Welcome back{firstName ? `, ${titleCase(firstName)}` : ""}
        </div>
        <div className="mt-2 text-gray-500">
          Here's what the team is working on today
        </div>
      </div>

      <div className="mt-8 flex justify-between gap-4">
        <div className="w-[25%] rounded-xl border border-gray-300 px-4 pt-3 pb-4">
          <div className="text-gray-600">OPEN</div>
          <div className="py-2 text-3xl font-light">{data?.totalElements}</div>
        </div>
        <div className="w-[25%] rounded-xl border border-gray-300 px-4 pt-3 pb-4">
          <div className="text-gray-600">ASSIGNED TO ME</div>
          <div className="py-2 text-3xl font-light text-green-600">
            {
              data?.content.filter((t) => t.assigneeId === String(user?.id))
                .length
            }
          </div>
        </div>
        <div className="w-[25%] rounded-xl border border-gray-300 px-4 pt-3 pb-4">
          <div className="text-gray-600">OVERDUE</div>
          <div className="font-lightpy-2 py-2 text-3xl text-red-600">2</div>
        </div>
        <div className="w-[25%] rounded-xl border border-gray-300 px-4 pt-3 pb-4">
          <div className="text-gray-600">RESOLVED</div>
          <div className="py-2 text-3xl font-light">
            {data?.content.filter((t) => t.status === "RESOLVED").length}
          </div>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="min-w-0 rounded-xl border border-gray-300 p-4">
          <div className="font-semibold text-gray-700">RECENT TICKETS</div>
          {data?.content.map((row) => {
            return (
              <div key={row.id}>
                <div className="my-2 flex justify-start gap-6 border-b border-gray-400 p-1.5">
                  <div className="text-gray-500">#{row.id}</div>
                  <div className="font-light">{row.title}</div>
                  <div>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`size-2 shrink-0 rounded-full ${priorityStyle(row.priority)}`}
                        aria-hidden="true"
                      />
                      <span className="font-light text-gray-700">
                        {titleCase(row.priority)}
                      </span>
                    </span>
                  </div>
                  <div className={statusStyle(row.status)}>{row.status}</div>
                </div>
              </div>
            );
          })}
        </div>
        <PriorityBreakdown tickets={data?.content ?? []} />
      </div>
    </div>
  );
}
