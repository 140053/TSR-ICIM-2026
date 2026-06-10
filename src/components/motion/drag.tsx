"use client"

import { motion } from "motion/react"

export default function Drag() {
    return <motion.div drag style={box} />
}

/**
 * ==============   Styles   ================
 */

const box = {
    width: 100,
    height: 100,
    backgroundColor: "#dd00ee",
    borderRadius: 10,
}
