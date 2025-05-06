import { Fragment } from "react";
import { Button } from "@/components/ui/button";
export default function MyPagination({ total = 1, page = 1, setPage, itemsPerPage = 4 }) {
  const totalPages = Math.ceil(total / itemsPerPage);
  return (
    <Fragment>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <Button
            onClick={() => {
              if (setPage) setPage(idx + 1);
            }}
            key={idx}
            variant={page === idx + 1 ? "default" : "outline"}
            size="icon"
            className="h-7 w-7"
          >
            {idx + 1}
          </Button>
        ))}
      </div>
    </Fragment>
  );
}
