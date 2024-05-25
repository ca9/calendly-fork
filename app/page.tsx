'use client';

import { Home } from './home/home';
import TimeRangeSelector from "@/app/home/TimeRangeSelector/TimeRangeSelector";
import React from "react";

export default function Page() {

    return (
        <div>
            <TimeRangeSelector />
            <Home />
        </div>
    );
}
